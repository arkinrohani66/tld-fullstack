/*
# Core identity/messaging/trip/fleet tables, money-flow triggers and driver bid updates

1. New Tables
- `profiles`: one row per auth user (created automatically by a trigger). Holds role,
  verification status and shared profile fields used by the app.
- `drivers` / `shippers`: role-specific registration data (one row per profile).
- `shipper_documents`: registration documents of a shipper, unique per (profile, doc type).
- `notifications`: per-user and broadcast notifications.
- `conversations` / `messages`: support and counterpart chat.
- `transport_trips` / `trip_locations` / `trip_checkpoints`: trip lifecycle data.
  A scheduled trip with standard checkpoints is created automatically when a bid is accepted.
- `driver_vehicles`: driver fleet management.
- `driver_earnings`: per-settlement earnings breakdown, created automatically on settlement.
- `driver_settlements`: payout requests of a driver.
- `driver_disputes`: driver arbitration claims.
- `driver_reviews`: shipper reviews of drivers; inserting one refreshes drivers.rating.

2. Security
- RLS enabled on every new table.
- profiles: read/update own row only.
- drivers: every signed-in user can read (needed for bid cards); only the owner can write.
- shippers, shipper_documents, driver_vehicles, driver_earnings, driver_settlements,
  driver_disputes: owner-only access.
- notifications: owner rows plus broadcast rows (user_id IS NULL) are readable;
  only the owner can mark them read.
- conversations/messages: owner-only through owner_id / conversation ownership.
- transport_trips and children: visible to the assigned driver and the cargo's shipper.
- driver_reviews: readable by all signed-in users; inserted by the reviewing shipper;
  the rated driver can only append a response.
- cargo_bids: drivers may now UPDATE the status of their own bid (cancel/counter flows).

3. Functions (upgraded, SECURITY DEFINER, service/client safe)
- `accept_driver_bid`: unchanged validation; now also creates a SCHEDULED transport_trips row
  with the standard trip checkpoints and a notification for the driver.
- `confirm_delivery_and_settle`: now accepts the confirmation from the shipper OR the assigned
  driver of the escrow. On success it also writes a driver_earnings row and notifications for
  both parties, in the same transaction.

4. Important Notes
- Statements are idempotent so this migration can be safely re-run.
- Money movement to bank accounts still happens outside this schema (ledger model).
*/

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  full_name text,
  national_id text,
  email text,
  phone text,
  role text CHECK (role IN ('DRIVER', 'SHIPPER', 'ADMIN')),
  verification_status text NOT NULL DEFAULT 'NOT_SUBMITTED'
    CHECK (verification_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESUBMIT_REQUIRED')),
  rejection_reason text,
  request_id text,
  driver_id text,
  company_name text,
  fleet_type text,
  truck_model text,
  plate_number text,
  avatar_url text,
  province text,
  city text,
  postal_code text,
  address text,
  birth_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid() OR user_id = auth.uid())
  WITH CHECK (id = auth.uid() OR user_id = auth.uid());

-- Create a profile automatically for every new auth user (OTP signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, phone)
  VALUES (NEW.id, NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  truck_model text,
  plate_number text,
  fleet_type text,
  smart_lock_status text NOT NULL DEFAULT 'LOCKED' CHECK (smart_lock_status IN ('LOCKED', 'UNLOCKED')),
  rating numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_trips integer NOT NULL DEFAULT 0 CHECK (total_trips >= 0),
  on_time_rate numeric(5, 2) NOT NULL DEFAULT 100 CHECK (on_time_rate >= 0 AND on_time_rate <= 100),
  safety_score numeric(5, 2) NOT NULL DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.drivers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;

DROP POLICY IF EXISTS "drivers_select_all_authenticated" ON public.drivers;
CREATE POLICY "drivers_select_all_authenticated" ON public.drivers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
CREATE POLICY "drivers_insert_own" ON public.drivers FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
CREATE POLICY "drivers_update_own" ON public.drivers FOR UPDATE
  TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- 3. SHIPPERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shippers (
  id text PRIMARY KEY DEFAULT 'SHP-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0'),
  profile_id uuid UNIQUE NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  shipper_type text CHECK (shipper_type IN ('LEGAL_ENTITY', 'INDIVIDUAL')),
  company_name text NOT NULL,
  company_type text,
  national_company_id text,
  registration_number text,
  economic_code text,
  establishment_date text,
  industry_sector text,
  monthly_freight_volume_tons numeric DEFAULT 0,
  preferred_truck_types text[] NOT NULL DEFAULT '{}',
  ceo_full_name text,
  ceo_national_id text,
  ceo_mobile text,
  landline_phone text,
  website text,
  office_province text,
  office_city text,
  office_postal_code text,
  office_address text,
  warehouse_province text,
  warehouse_city text,
  warehouse_address text,
  warehouse_contact_person text,
  warehouse_contact_phone text,
  warehouse_facilities text[] NOT NULL DEFAULT '{}',
  bank_name text,
  bank_iban text,
  bank_account_number text,
  bank_branch text,
  account_holder_name text,
  registration_step integer NOT NULL DEFAULT 1 CHECK (registration_step >= 1 AND registration_step <= 5),
  verification_status text NOT NULL DEFAULT 'PENDING'
    CHECK (verification_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shippers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.shippers TO authenticated;

DROP POLICY IF EXISTS "shippers_select_own" ON public.shippers;
CREATE POLICY "shippers_select_own" ON public.shippers FOR SELECT
  TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "shippers_insert_own" ON public.shippers;
CREATE POLICY "shippers_insert_own" ON public.shippers FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "shippers_update_own" ON public.shippers;
CREATE POLICY "shippers_update_own" ON public.shippers FOR UPDATE
  TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- 4. SHIPPER DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipper_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id text NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  file_name text,
  file_size_bytes integer,
  mime_type text,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_note text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, doc_type)
);

ALTER TABLE public.shipper_documents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shipper_documents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.shipper_documents TO authenticated;

DROP POLICY IF EXISTS "shipper_documents_select_own" ON public.shipper_documents;
CREATE POLICY "shipper_documents_select_own" ON public.shipper_documents FOR SELECT
  TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "shipper_documents_insert_own" ON public.shipper_documents;
CREATE POLICY "shipper_documents_insert_own" ON public.shipper_documents FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "shipper_documents_update_own" ON public.shipper_documents;
CREATE POLICY "shipper_documents_update_own" ON public.shipper_documents FOR UPDATE
  TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  timestamp text,
  category text NOT NULL DEFAULT 'SYSTEM'
    CHECK (category IN ('ALL', 'CARGO', 'TRIP', 'FINANCIAL', 'SYSTEM', 'SECURITY')),
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO', 'SUCCESS')),
  is_read boolean NOT NULL DEFAULT false,
  entity_id text,
  entity_type text,
  eta text,
  status_text text,
  detailed_description text,
  tld_box_id text,
  temperature text,
  threshold text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notifications FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "notifications_select_own_or_broadcast" ON public.notifications;
CREATE POLICY "notifications_select_own_or_broadcast" ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "notifications_insert_own_or_broadcast" ON public.notifications;
CREATE POLICY "notifications_insert_own_or_broadcast" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. CONVERSATIONS AND MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  participant_role text NOT NULL DEFAULT 'DRIVER',
  participant_avatar text,
  online_status text NOT NULL DEFAULT 'ONLINE' CHECK (online_status IN ('ONLINE', 'BUSY', 'OFFLINE')),
  last_message text,
  last_message_time text,
  unread_count integer NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  cargo_id text,
  status_type text DEFAULT 'NORMAL' CHECK (status_type IN ('NORMAL', 'WARNING', 'OFFLINE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_updated ON public.conversations (owner_id, updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.conversations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;

DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
CREATE POLICY "conversations_select_own" ON public.conversations FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
CREATE POLICY "conversations_insert_own" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;
CREATE POLICY "conversations_update_own" ON public.conversations FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text,
  sender_avatar text,
  sender_role text CHECK (sender_role IN ('DRIVER', 'SHIPPER', 'DISPATCHER', 'SYSTEM')),
  text text NOT NULL,
  timestamp text,
  status text NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  is_outgoing boolean NOT NULL DEFAULT true,
  is_system_alert boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.messages FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

DROP POLICY IF EXISTS "messages_select_own_conversations" ON public.messages;
CREATE POLICY "messages_select_own_conversations" ON public.messages FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.owner_id = auth.uid()));

DROP POLICY IF EXISTS "messages_insert_own_conversations" ON public.messages;
CREATE POLICY "messages_insert_own_conversations" ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.owner_id = auth.uid()));

DROP POLICY IF EXISTS "messages_update_own_conversations" ON public.messages;
CREATE POLICY "messages_update_own_conversations" ON public.messages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.owner_id = auth.uid()));

-- ============================================================
-- 7. TRANSPORT TRIPS, LOCATIONS AND CHECKPOINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transport_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number text UNIQUE,
  cargo_id text REFERENCES public.cargos(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  vehicle_id text,
  origin text,
  destination text,
  departure_time text,
  eta text,
  distance_covered_km numeric NOT NULL DEFAULT 0 CHECK (distance_covered_km >= 0),
  distance_remaining_km numeric NOT NULL DEFAULT 0 CHECK (distance_remaining_km >= 0),
  total_distance_km numeric NOT NULL DEFAULT 0 CHECK (total_distance_km >= 0),
  current_speed_kmh numeric NOT NULL DEFAULT 0 CHECK (current_speed_kmh >= 0),
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('ACTIVE', 'COMPLETED', 'SCHEDULED', 'DELAYED')),
  progress_percentage numeric NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transport_trips_driver ON public.transport_trips (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_trips_cargo ON public.transport_trips (cargo_id);

ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.transport_trips FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.transport_trips TO authenticated;

DROP POLICY IF EXISTS "transport_trips_select_driver_or_shipper" ON public.transport_trips;
CREATE POLICY "transport_trips_select_driver_or_shipper" ON public.transport_trips FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = transport_trips.cargo_id AND c.shipper_id = auth.uid())
  );

DROP POLICY IF EXISTS "transport_trips_insert_driver" ON public.transport_trips;
CREATE POLICY "transport_trips_insert_driver" ON public.transport_trips FOR INSERT
  TO authenticated WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "transport_trips_update_driver_or_shipper" ON public.transport_trips;
CREATE POLICY "transport_trips_update_driver_or_shipper" ON public.transport_trips FOR UPDATE
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = transport_trips.cargo_id AND c.shipper_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.trip_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.transport_trips(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  speed_kmh numeric,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON public.trip_locations (trip_id, recorded_at DESC);

ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trip_locations FROM PUBLIC, anon;
GRANT SELECT ON public.trip_locations TO authenticated;

DROP POLICY IF EXISTS "trip_locations_select_via_trip" ON public.trip_locations;
CREATE POLICY "trip_locations_select_via_trip" ON public.trip_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_trips t
      WHERE t.id = trip_locations.trip_id
        AND (t.driver_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = t.cargo_id AND c.shipper_id = auth.uid()))
    )
  );

CREATE TABLE IF NOT EXISTS public.trip_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.transport_trips(id) ON DELETE CASCADE,
  stage text NOT NULL,
  title text NOT NULL,
  description text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  actor_role text,
  otp_code text,
  smart_seal_code text,
  photo_url text,
  signature_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, stage)
);

ALTER TABLE public.trip_checkpoints ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trip_checkpoints FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.trip_checkpoints TO authenticated;

DROP POLICY IF EXISTS "trip_checkpoints_select_via_trip" ON public.trip_checkpoints;
CREATE POLICY "trip_checkpoints_select_via_trip" ON public.trip_checkpoints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_trips t
      WHERE t.id = trip_checkpoints.trip_id
        AND (t.driver_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = t.cargo_id AND c.shipper_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "trip_checkpoints_update_via_trip" ON public.trip_checkpoints;
CREATE POLICY "trip_checkpoints_update_via_trip" ON public.trip_checkpoints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_trips t
      WHERE t.id = trip_checkpoints.trip_id
        AND (t.driver_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = t.cargo_id AND c.shipper_id = auth.uid()))
    )
  );

-- ============================================================
-- 8. DRIVER VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  truck_type text NOT NULL DEFAULT 'تریلی کفی',
  brand text,
  model text,
  build_year text,
  color text,
  plate_number text,
  plate_part1 text,
  plate_letter text,
  plate_part2 text,
  plate_iran_code text,
  chassis_number text,
  engine_number text,
  smart_card_truck text,
  capacity_tons numeric NOT NULL DEFAULT 22 CHECK (capacity_tons > 0),
  volume_m3 numeric,
  axles integer NOT NULL DEFAULT 5 CHECK (axles > 0),
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  smart_box_id text,
  smart_lock_status text NOT NULL DEFAULT 'LOCKED' CHECK (smart_lock_status IN ('LOCKED', 'UNLOCKED')),
  current_speed_kmh numeric NOT NULL DEFAULT 0,
  cargo_temperature numeric,
  ambient_humidity numeric,
  battery_health_percentage numeric,
  fuel_level_percentage numeric,
  tire_pressure_bar numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_vehicles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.driver_vehicles TO authenticated;

DROP POLICY IF EXISTS "driver_vehicles_select_own" ON public.driver_vehicles;
CREATE POLICY "driver_vehicles_select_own" ON public.driver_vehicles FOR SELECT
  TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "driver_vehicles_insert_own" ON public.driver_vehicles;
CREATE POLICY "driver_vehicles_insert_own" ON public.driver_vehicles FOR INSERT
  TO authenticated WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "driver_vehicles_update_own" ON public.driver_vehicles;
CREATE POLICY "driver_vehicles_update_own" ON public.driver_vehicles FOR UPDATE
  TO authenticated USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());

-- ============================================================
-- 9. DRIVER EARNINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  cargo_id text REFERENCES public.cargos(id) ON DELETE SET NULL,
  trip_id text,
  gross_fare_amount bigint NOT NULL DEFAULT 0 CHECK (gross_fare_amount >= 0),
  commission_amount bigint NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  toll_deduction_amount bigint NOT NULL DEFAULT 0 CHECK (toll_deduction_amount >= 0),
  net_earnings_amount bigint NOT NULL DEFAULT 0 CHECK (net_earnings_amount >= 0),
  date text,
  status text NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'AVAILABLE_FOR_CASHOUT', 'PENDING_ESCROW')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON public.driver_earnings (driver_id, created_at DESC);

ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_earnings FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.driver_earnings TO authenticated;

DROP POLICY IF EXISTS "driver_earnings_select_own" ON public.driver_earnings;
CREATE POLICY "driver_earnings_select_own" ON public.driver_earnings FOR SELECT
  TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "driver_earnings_insert_own" ON public.driver_earnings;
CREATE POLICY "driver_earnings_insert_own" ON public.driver_earnings FOR INSERT
  TO authenticated WITH CHECK (driver_id = auth.uid());

-- ============================================================
-- 10. DRIVER SETTLEMENTS (payout requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  settlement_reference text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  iban text,
  bank_name text,
  transfer_type text NOT NULL DEFAULT 'PAYA' CHECK (transfer_type IN ('INSTANT_CARD', 'PAYA', 'SATNA')),
  status text NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('SUCCESS', 'PENDING', 'PROCESSING')),
  paya_tracking_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_driver ON public.driver_settlements (driver_id, requested_at DESC);

ALTER TABLE public.driver_settlements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_settlements FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.driver_settlements TO authenticated;

DROP POLICY IF EXISTS "driver_settlements_select_own" ON public.driver_settlements;
CREATE POLICY "driver_settlements_select_own" ON public.driver_settlements FOR SELECT
  TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "driver_settlements_insert_own" ON public.driver_settlements;
CREATE POLICY "driver_settlements_insert_own" ON public.driver_settlements FOR INSERT
  TO authenticated WITH CHECK (driver_id = auth.uid());

-- ============================================================
-- 11. DRIVER DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  cargo_id text REFERENCES public.cargos(id) ON DELETE SET NULL,
  dispute_type text NOT NULL
    CHECK (dispute_type IN ('DEMURRAGE_CLAIM', 'UNPAID_FARE', 'CARGO_DAMAGE', 'ROUTE_ACCIDENT_SOS', 'SHIPPER_DISAGREEMENT', 'OTHER')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  claimed_amount bigint NOT NULL DEFAULT 0 CHECK (claimed_amount >= 0),
  trip_id text,
  evidence_photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'UNDER_REVIEW'
    CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED_WITH_PAYOUT')),
  arbitration_note text,
  resolution_amount bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_driver_disputes_driver ON public.driver_disputes (driver_id, created_at DESC);

ALTER TABLE public.driver_disputes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_disputes FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.driver_disputes TO authenticated;

DROP POLICY IF EXISTS "driver_disputes_select_own" ON public.driver_disputes;
CREATE POLICY "driver_disputes_select_own" ON public.driver_disputes FOR SELECT
  TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "driver_disputes_insert_own" ON public.driver_disputes;
CREATE POLICY "driver_disputes_insert_own" ON public.driver_disputes FOR INSERT
  TO authenticated WITH CHECK (driver_id = auth.uid());

-- ============================================================
-- 12. DRIVER REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shipper_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  cargo_id text,
  shipper_name text,
  shipper_company text,
  rating numeric(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  trip_route text,
  tags text[] NOT NULL DEFAULT '{}',
  cargo_type text,
  waybill_number text,
  driver_response text,
  response_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver ON public.driver_reviews (driver_id, created_at DESC);

ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.driver_reviews FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE (driver_response, response_date) ON public.driver_reviews TO authenticated;

DROP POLICY IF EXISTS "driver_reviews_select_all_authenticated" ON public.driver_reviews;
CREATE POLICY "driver_reviews_select_all_authenticated" ON public.driver_reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "driver_reviews_insert_own" ON public.driver_reviews;
CREATE POLICY "driver_reviews_insert_own" ON public.driver_reviews FOR INSERT
  TO authenticated WITH CHECK (shipper_id = auth.uid());

DROP POLICY IF EXISTS "driver_reviews_update_rated_driver" ON public.driver_reviews;
CREATE POLICY "driver_reviews_update_rated_driver" ON public.driver_reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.profile_id = auth.uid() AND d.id = driver_reviews.driver_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.drivers d WHERE d.profile_id = auth.uid() AND d.id = driver_reviews.driver_id));

-- Keep drivers.rating in sync with incoming reviews
CREATE OR REPLACE FUNCTION public.refresh_driver_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
BEGIN
  SELECT round(avg(rating)::numeric, 2) INTO v_avg
  FROM public.driver_reviews
  WHERE driver_id = NEW.driver_id;

  IF v_avg IS NOT NULL THEN
    UPDATE public.drivers SET rating = v_avg, updated_at = now() WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_driver_rating ON public.driver_reviews;
CREATE TRIGGER trg_refresh_driver_rating
  AFTER INSERT ON public.driver_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_driver_rating();

-- ============================================================
-- 13. EMBEDDING FOREIGN KEYS (cargo_bids -> profiles / drivers)
-- ============================================================
ALTER TABLE public.cargo_bids DROP CONSTRAINT IF EXISTS cargo_bids_driver_profile_fkey;
ALTER TABLE public.cargo_bids
  ADD CONSTRAINT cargo_bids_driver_profile_fkey
  FOREIGN KEY (driver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.cargo_bids DROP CONSTRAINT IF EXISTS cargo_bids_driver_stats_fkey;
ALTER TABLE public.cargo_bids
  ADD CONSTRAINT cargo_bids_driver_stats_fkey
  FOREIGN KEY (driver_id) REFERENCES public.drivers(profile_id) ON DELETE CASCADE NOT VALID;

-- Drivers may update the status of their own bids (cancel / counter acceptance)
GRANT UPDATE (status) ON public.cargo_bids TO authenticated;

DROP POLICY IF EXISTS "cargo_bids_driver_update_own_status" ON public.cargo_bids;
CREATE POLICY "cargo_bids_driver_update_own_status" ON public.cargo_bids FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- ============================================================
-- 14. UPGRADED SERVER FUNCTIONS FOR THE MONEY FLOW
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_driver_bid(p_actor_id uuid, p_cargo_id text, p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cargo cargos%ROWTYPE;
  v_bid cargo_bids%ROWTYPE;
  v_trip_id uuid;
BEGIN
  IF p_actor_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cargo FROM public.cargos WHERE id = p_cargo_id FOR UPDATE;
  IF NOT FOUND OR v_cargo.shipper_id <> p_actor_id THEN
    RAISE EXCEPTION 'INVALID_CARGO';
  END IF;
  IF v_cargo.status <> 'PENDING_DRIVER' THEN
    RAISE EXCEPTION 'CARGO_NOT_OPEN';
  END IF;

  SELECT * INTO v_bid FROM public.cargo_bids
   WHERE id = p_bid_id AND cargo_id = p_cargo_id AND status = 'PENDING';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_BID';
  END IF;

  UPDATE public.cargos
     SET status = 'DRIVER_ASSIGNED',
         assigned_driver_id = v_bid.driver_id,
         agreed_fare_tomans = v_bid.proposed_fare_tomans
   WHERE id = p_cargo_id;

  UPDATE public.cargo_bids
     SET status = CASE WHEN id = p_bid_id THEN 'ACCEPTED' ELSE 'REJECTED' END
   WHERE cargo_id = p_cargo_id AND status = 'PENDING';

  -- Create the scheduled trip with standard lifecycle checkpoints
  INSERT INTO public.transport_trips (cargo_id, driver_id, origin, destination, status)
  VALUES (p_cargo_id, v_bid.driver_id, v_cargo.origin_city, v_cargo.destination_city, 'SCHEDULED')
  RETURNING id INTO v_trip_id;

  INSERT INTO public.trip_checkpoints (trip_id, stage, title, description) VALUES
    (v_trip_id, 'LOADING_STARTED', 'رسیدن به مبدأ و شروع بارگیری', 'راننده در مبدأ حاضر و عملیات بارگیری آغاز شد.'),
    (v_trip_id, 'CARGO_SECURED', 'مهاربندی و ایمن‌سازی بار', 'بار مهاربندی و با تسمه/زنجیر ایمن شد.'),
    (v_trip_id, 'WAYBILL_SEALED', 'صدور بارنامه و پلمپ هوشمند', 'بارنامه الکترونیک صادر و پلمپ هوشمند TLD نصب شد.'),
    (v_trip_id, 'ARRIVED_DEST', 'رسیدن به مقصد', 'خودرو به محل تخلیه در مقصد رسید.'),
    (v_trip_id, 'SMART_LOCK_RELEASED', 'بازگشایی قفل هوشمند در مقصد', 'قفل هوشمند پس از تأیید کد تحویل باز شد.'),
    (v_trip_id, 'UNLOADED', 'تخلیه بار', 'عملیات تخلیه بار تکمیل شد.');

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type, entity_id)
  VALUES (
    v_bid.driver_id,
    'پیشنهاد شما پذیرفته شد',
    'پیشنهاد شما برای محموله «' || v_cargo.title || '» پذیرفته شد. کرایه توافقی: ' || v_bid.proposed_fare_tomans::text || ' تومان.',
    'CARGO', 'SUCCESS', 'CARGO', p_cargo_id
  );

  RETURN jsonb_build_object(
    'cargo_id', p_cargo_id,
    'driver_id', v_bid.driver_id,
    'agreed_fare_tomans', v_bid.proposed_fare_tomans,
    'trip_id', v_trip_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.accept_driver_bid(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_driver_bid(uuid, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.confirm_delivery_and_settle(
  p_actor_id uuid,
  p_cargo_id text,
  p_otp text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := p_actor_id;
  e public.escrow_accounts%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO e
  FROM public.escrow_accounts
  WHERE cargo_id = p_cargo_id AND status = 'HELD_SECURE'
  FOR UPDATE;

  IF NOT FOUND OR (e.shipper_id <> v_uid AND e.driver_id <> v_uid) THEN
    RETURN jsonb_build_object('status', 'NOT_FOUND');
  END IF;

  IF e.otp_failed_attempts >= 5 THEN
    RETURN jsonb_build_object('status', 'OTP_LOCKED');
  END IF;

  IF e.delivery_otp <> p_otp THEN
    UPDATE public.escrow_accounts SET otp_failed_attempts = otp_failed_attempts + 1 WHERE id = e.id;
    RETURN jsonb_build_object('status', 'INVALID_OTP', 'attempts_left', 4 - e.otp_failed_attempts);
  END IF;

  UPDATE public.escrow_accounts
  SET status = 'RELEASED_TO_DRIVER', released_at = now()
  WHERE id = e.id;

  INSERT INTO public.wallets (user_id, balance_tomans)
  VALUES (e.driver_id, e.freight_amount_tomans)
  ON CONFLICT (user_id) DO UPDATE
  SET balance_tomans = public.wallets.balance_tomans + EXCLUDED.balance_tomans,
      updated_at = now();

  INSERT INTO public.wallet_transactions (user_id, title, amount_tomans, type, related_entity_id)
  VALUES (e.driver_id, 'آزادسازی کرایه بار', e.freight_amount_tomans, 'CREDIT', p_cargo_id);

  INSERT INTO public.driver_earnings (
    driver_id, cargo_id, gross_fare_amount, commission_amount,
    toll_deduction_amount, net_earnings_amount, date, status
  ) VALUES (
    e.driver_id, p_cargo_id, e.freight_amount_tomans, e.commission_amount_tomans,
    0, e.freight_amount_tomans, to_char(now(), 'YYYY/MM/DD'), 'PAID'
  );

  INSERT INTO public.platform_revenue_ledger (
    escrow_id, cargo_id, commission_amount_tomans, vat_amount_tomans, total_platform_cut_tomans
  ) VALUES (
    e.id, p_cargo_id, e.commission_amount_tomans, e.vat_amount_tomans,
    e.commission_amount_tomans + e.vat_amount_tomans
  );

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type, entity_id) VALUES
    (e.driver_id,
     'کرایه شما آزاد شد',
     'کرایه محموله به مبلغ ' || e.freight_amount_tomans::text || ' تومان به کیف پول شما واریز شد.',
     'FINANCIAL', 'SUCCESS', 'PAYMENT', p_cargo_id),
    (e.shipper_id,
     'تحویل محموله تأیید شد',
     'تحویل و تسویه محموله با موفقیت انجام شد و وجه امانی به راننده آزاد گردید.',
     'FINANCIAL', 'SUCCESS', 'PAYMENT', p_cargo_id);

  RETURN jsonb_build_object(
    'status', 'RELEASED',
    'driver_credit_tomans', e.freight_amount_tomans,
    'platform_commission_tomans', e.commission_amount_tomans,
    'platform_vat_tomans', e.vat_amount_tomans
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_delivery_and_settle(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_delivery_and_settle(uuid, text, text) TO service_role;
