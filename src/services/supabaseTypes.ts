// Authoritative TLD Supabase Schema Type Definitions
// Corresponds directly to database tables in Supabase / PostgreSQL

export interface SupabaseProfile {
  id: string;
  user_id?: string;
  full_name?: string;
  national_id?: string;
  email?: string;
  phone?: string;
  role?: 'DRIVER' | 'SHIPPER' | 'ADMIN';
  verification_status?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'RESUBMIT_REQUIRED';
  rejection_reason?: string;
  request_id?: string;
  driver_id?: string;
  company_name?: string;
  fleet_type?: string;
  truck_model?: string;
  plate_number?: string;
  avatar_url?: string;
  province?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  birth_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseDriver {
  id: string;
  profile_id: string;
  truck_model?: string;
  plate_number?: string;
  fleet_type?: string;
  rating?: number;
  is_available?: boolean;
  smart_lock_status?: 'LOCKED' | 'UNLOCKED';
  created_at?: string;
}

export interface SupabaseShipper {
  id: string;
  profile_id: string;
  user_id?: string;
  shipper_type?: 'LEGAL_ENTITY' | 'INDIVIDUAL';
  company_name: string;
  company_type?: string;
  national_company_id?: string;
  registration_number?: string;
  economic_code?: string;
  establishment_date?: string;
  industry_sector?: string;
  monthly_freight_volume_tons?: number;
  preferred_truck_types?: string[];
  ceo_full_name?: string;
  ceo_national_id?: string;
  ceo_mobile?: string;
  landline_phone?: string;
  website?: string;
  office_province?: string;
  office_city?: string;
  office_postal_code?: string;
  office_address?: string;
  warehouse_province?: string;
  warehouse_city?: string;
  warehouse_address?: string;
  warehouse_contact_person?: string;
  warehouse_contact_phone?: string;
  warehouse_facilities?: string[];
  bank_name?: string;
  bank_iban?: string;
  bank_account_number?: string;
  bank_branch?: string;
  account_holder_name?: string;
  registration_step?: number;
  verification_status?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED';
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseShipperDocument {
  id: string;
  shipper_id: string;
  profile_id?: string;
  doc_type: string;
  title: string;
  file_url: string;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  verification_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_note?: string;
  uploaded_at?: string;
}

export interface SupabaseCargo {
  id: string;
  title: string;
  origin_city: string;
  destination_city: string;
  origin_address?: string | null;
  destination_address?: string | null;
  weight_tons?: number | null;
  truck_type?: string | null;
  cargo_type?: string | null;
  notes?: string | null;
  status: 'PENDING_DRIVER' | 'DRIVER_ASSIGNED' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  agreed_fare_tomans?: number | null;
  assigned_driver_id?: string | null;
  shipper_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseCargoBid {
  id: string;
  cargo_id: string;
  driver_id: string;
  proposed_fare_tomans: number;
  ready_to_load_time?: string;
  driver_notes?: string;
  status: 'PENDING' | 'COUNTER_OFFER' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  counter_offer_tomans?: number | null;
  counter_offer_note?: string | null;
  counter_offered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseShipperContract {
  id: string;
  cargo_id: string;
  shipper_id: string;
  driver_id: string;
  contract_number: string;
  total_amount_tomans: number;
  escrow_amount_tomans: number;
  insurance_policy_number: string;
  terms_text: string;
  sha256_hash: string;
  shipper_signed_at?: string;
  driver_signed_at?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SupabaseEscrowAccount {
  id: string;
  cargo_id: string;
  shipper_id: string;
  driver_id: string;
  freight_amount_tomans: number;
  commission_amount_tomans: number;
  vat_amount_tomans: number;
  total_hold_amount_tomans: number;
  status: 'HELD_SECURE' | 'RELEASED_TO_DRIVER';
  otp_failed_attempts?: number;
  released_at?: string | null;
  created_at?: string;
}

export interface SupabaseTLDBox {
  id: string;
  box_serial_number: string;
  device_model: string;
  imei: string;
  firmware_version: string;
  sim_iccid: string;
  active_seal_number: string;
  seal_state: 'LOCKED' | 'UNLOCKED' | 'TAMPERED';
  battery_health_pct: number;
  battery_level_pct: number;
  solar_charging_active: boolean;
  external_power_connected: boolean;
  active_cargo_id?: string;
  active_driver_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseTLDTelemetry {
  id: string;
  box_id: string;
  cargo_id?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  altitude_m: number;
  temp_zone1_c: number;
  temp_zone2_c: number;
  temp_zone3_c: number;
  ambient_temp_c: number;
  weight_tons: number;
  front_axle_tons: number;
  drive_axle_tons: number;
  trailer_axle_tons: number;
  shock_g: number;
  humidity_pct: number;
  seal_resistance_ohm: number;
  geofence_status: 'IN_BOUNDS' | 'DEVIATED';
  created_at?: string;
}

export interface SupabaseTLDSmartAlert {
  id: string;
  box_id?: string;
  cargo_id?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  sensor_value: string;
  threshold_value: string;
  location_address?: string;
  is_resolved: boolean;
  action_taken?: string;
  resolved_at?: string;
  created_at?: string;
}

export interface SupabaseTransportTrip {
  id: string;
  cargo_id: string;
  driver_id?: string;
  vehicle_id?: string;
  origin: string;
  destination: string;
  departure_time?: string;
  eta?: string;
  distance_covered_km?: number;
  distance_remaining_km?: number;
  total_distance_km?: number;
  current_speed_kmh?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED' | 'DELAYED';
  progress_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseTripLocation {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  speed_kmh?: number;
  recorded_at?: string;
}

export interface SupabaseCargoDispute {
  id: string;
  cargo_id: string;
  cargo_number: string;
  filed_by_id: string;
  filed_by_role: 'SHIPPER' | 'DRIVER';
  claimant_name: string;
  claimant_phone?: string;
  respondent_name: string;
  category: 'TEMPERATURE_BREACH' | 'WEIGHT_DISCREPANCY' | 'DELAY_DELIVERY' | 'DAMAGED_CARGO' | 'PAYMENT_UNPAID' | 'OTHER';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ARBITRATION_HEARING' | 'RESOLVED' | 'REJECTED';
  claimed_amount_tomans: number;
  settled_amount_tomans?: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseDriverRating {
  id: string;
  cargo_id: string;
  driver_id: string;
  shipper_id: string;
  score_overall: number;
  score_punctuality: number;
  score_cargo_care: number;
  score_communication: number;
  comment?: string;
  created_at?: string;
}

export interface SupabaseWallet {
  user_id: string;
  balance_tomans: number;
  updated_at?: string;
}

export interface SupabaseWalletTransaction {
  id: string;
  user_id: string;
  title: string;
  amount_tomans: number;
  type: 'CREDIT' | 'DEBIT';
  related_entity_id?: string | null;
  created_at?: string;
}

export interface SupabaseNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  timestamp?: string;
  category: 'ALL' | 'CARGO' | 'TRIP' | 'FINANCIAL' | 'SYSTEM' | 'SECURITY';
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  is_read: boolean;
  entity_id?: string;
  entity_type?: 'CARGO' | 'TRIP' | 'PAYMENT' | 'SENSOR' | 'WALLET' | 'SYSTEM' | 'SECURITY';
  eta?: string;
  status_text?: string;
  detailed_description?: string;
  tld_box_id?: string;
  temperature?: string;
  threshold?: string;
  created_at?: string;
}

export interface SupabaseConversation {
  id: string;
  participant_name: string;
  participant_role: string;
  participant_avatar?: string;
  online_status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  cargo_id?: string;
  status_type?: 'NORMAL' | 'WARNING' | 'OFFLINE';
  updated_at?: string;
  created_at?: string;
}

export interface SupabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  sender_role?: 'DRIVER' | 'SHIPPER' | 'DISPATCHER' | 'SYSTEM';
  text: string;
  timestamp?: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  is_outgoing?: boolean;
  is_system_alert?: boolean;
  created_at?: string;
}

export interface SupabasePlatformRevenueLedger {
  id: string;
  cargo_id: string;
  cargo_title?: string;
  shipper_name?: string;
  driver_name?: string;
  freight_amount_tomans: number;
  commission_rate_pct: number;
  commission_amount_tomans: number;
  vat_tax_tomans: number;
  total_platform_cut_tomans: number;
  driver_net_tomans: number;
  escrow_ref?: string;
  status: 'LOCKED_IN_ESCROW' | 'COLLECTED_IN_TREASURY' | 'REFUNDED';
  tx_hash?: string;
  created_at?: string;
}

export interface SupabasePlatformTreasury {
  id: string;
  treasury_account_number: string;
  bank_name: string;
  iban: string;
  total_commission_collected_tomans: number;
  total_vat_collected_tomans: number;
  balance_tomans: number;
  last_settlement_date?: string;
  updated_at?: string;
}

