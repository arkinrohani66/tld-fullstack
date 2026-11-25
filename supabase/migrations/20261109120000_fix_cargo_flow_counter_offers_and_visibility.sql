/*
# TLD — cargo lifecycle, counter-offer flow and counterparty visibility fixes

این migration باگ‌های ساختاری زیر را رفع می‌کند (قابل اجرای مجدد / idempotent):

1. `cargos.id` هیچ مقدار پیش‌فرضی نداشت، بنابراین هر insert بدون id
   (cargoService.addCargo) با خطای not-null شکست می‌خورد. اکنون پیش‌فرض دارد.
2. CHECK وضعیت `cargos` فقط PENDING_DRIVER/DRIVER_ASSIGNED/CANCELLED را می‌پذیرفت؛
   بنابراین هر به‌روزرسانی به IN_TRANSIT / LOADING / DELIVERED خطا می‌داد و چرخه سفر
   ناتمام می‌ماند. مقدارهای چرخه کامل اضافه شد.
3. `cargo_bids` ستون‌های پیشنهاد متقابل و وضعیت COUNTER_OFFER را ندارد؛ دکمه
   «پذیرش پیشنهاد متقابل» در اپ روی چنین وضعیتی هیچ‌وقت فعال نمی‌شد.
   ستون‌ها + مجوز صاحب بار برای ثبت پیشنهاد متقابل + تابع پذیرش راننده اضافه شد.
4. `confirm_delivery_and_settle` وضعیت محموله و سفر را به‌روزرسانی نمی‌کرد؛ محموله
   برای همیشه DRIVER_ASSIGNED می‌ماند. اکنون DELIVERED / COMPLETED می‌شود.
5. سیاست RLS روی `profiles` اجازه خواندن پروفایل طرف مقابل را نمی‌داد، در نتیجه نام
   راننده در کارت پیشنهادهای صاحب بار خالی می‌ماند. ویو `profiles_public` با فقط
   ستون‌های غیرحساس اضافه شد.
6. هر کاربر واردشده می‌توانست اعلان عمومی (user_id IS NULL) برای همه درج کند. محدود شد.
*/

-- ============================================================
-- 1 & 2. cargos: default id, full status lifecycle, updated_at
-- ============================================================
ALTER TABLE public.cargos
  ALTER COLUMN id SET DEFAULT 'CRG-' || lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

ALTER TABLE public.cargos DROP CONSTRAINT IF EXISTS cargos_status_check;
ALTER TABLE public.cargos
  ADD CONSTRAINT cargos_status_check
  CHECK (status IN ('PENDING_DRIVER', 'DRIVER_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'));

ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS origin_address text;
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS destination_address text;
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS cargo_type text;
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS notes text;

-- صاحب بار باید بتواند محموله خودش را لغو/به‌روزرسانی کند (قبلاً هیچ مجوز UPDATE نبود)
GRANT UPDATE (status, title, origin_city, destination_city, weight_tons, truck_type,
              origin_address, destination_address, cargo_type, notes, updated_at)
  ON public.cargos TO authenticated;

DROP POLICY IF EXISTS "cargos_update_own_shipper" ON public.cargos;
CREATE POLICY "cargos_update_own_shipper" ON public.cargos FOR UPDATE
  TO authenticated
  USING (shipper_id = auth.uid())
  WITH CHECK (shipper_id = auth.uid());

-- ============================================================
-- 3. cargo_bids: counter-offer columns, status values, policies
-- ============================================================
ALTER TABLE public.cargo_bids DROP CONSTRAINT IF EXISTS cargo_bids_status_check;
ALTER TABLE public.cargo_bids
  ADD CONSTRAINT cargo_bids_status_check
  CHECK (status IN ('PENDING', 'COUNTER_OFFER', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'));

ALTER TABLE public.cargo_bids ADD COLUMN IF NOT EXISTS counter_offer_tomans bigint
  CHECK (counter_offer_tomans IS NULL OR counter_offer_tomans > 0);
ALTER TABLE public.cargo_bids ADD COLUMN IF NOT EXISTS counter_offer_note text;
ALTER TABLE public.cargo_bids ADD COLUMN IF NOT EXISTS counter_offered_at timestamptz;
ALTER TABLE public.cargo_bids ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT UPDATE (counter_offer_tomans, counter_offer_note, counter_offered_at, updated_at)
  ON public.cargo_bids TO authenticated;

-- صاحب بار می‌تواند روی پیشنهادهای محموله خودش پیشنهاد متقابل بگذارد
DROP POLICY IF EXISTS "cargo_bids_shipper_counter_offer" ON public.cargo_bids;
CREATE POLICY "cargo_bids_shipper_counter_offer" ON public.cargo_bids FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = cargo_bids.cargo_id AND c.shipper_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = cargo_bids.cargo_id AND c.shipper_id = auth.uid()));

-- ============================================================
-- 4. accept_counter_offer: راننده پیشنهاد متقابل صاحب بار را می‌پذیرد
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_counter_offer(p_actor_id uuid, p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cargo public.cargos%ROWTYPE;
  v_bid public.cargo_bids%ROWTYPE;
  v_trip_id uuid;
BEGIN
  IF p_actor_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_bid FROM public.cargo_bids WHERE id = p_bid_id FOR UPDATE;
  IF NOT FOUND OR v_bid.driver_id <> p_actor_id THEN
    RAISE EXCEPTION 'INVALID_BID';
  END IF;
  IF v_bid.status <> 'COUNTER_OFFER' OR v_bid.counter_offer_tomans IS NULL THEN
    RAISE EXCEPTION 'NO_COUNTER_OFFER';
  END IF;

  SELECT * INTO v_cargo FROM public.cargos WHERE id = v_bid.cargo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CARGO';
  END IF;
  IF v_cargo.status <> 'PENDING_DRIVER' THEN
    RAISE EXCEPTION 'CARGO_NOT_OPEN';
  END IF;

  UPDATE public.cargos
     SET status = 'DRIVER_ASSIGNED',
         assigned_driver_id = v_bid.driver_id,
         agreed_fare_tomans = v_bid.counter_offer_tomans,
         updated_at = now()
   WHERE id = v_cargo.id;

  UPDATE public.cargo_bids
     SET status = CASE WHEN id = v_bid.id THEN 'ACCEPTED' ELSE 'REJECTED' END,
         proposed_fare_tomans = CASE WHEN id = v_bid.id THEN v_bid.counter_offer_tomans ELSE proposed_fare_tomans END,
         updated_at = now()
   WHERE cargo_id = v_cargo.id AND status IN ('PENDING', 'COUNTER_OFFER');

  INSERT INTO public.transport_trips (cargo_id, driver_id, origin, destination, status)
  VALUES (v_cargo.id, v_bid.driver_id, v_cargo.origin_city, v_cargo.destination_city, 'SCHEDULED')
  RETURNING id INTO v_trip_id;

  INSERT INTO public.trip_checkpoints (trip_id, stage, title, description) VALUES
    (v_trip_id, 'LOADING_STARTED', 'رسیدن به مبدأ و شروع بارگیری', 'راننده در مبدأ حاضر و عملیات بارگیری آغاز شد.'),
    (v_trip_id, 'CARGO_SECURED', 'مهاربندی و ایمن‌سازی بار', 'بار مهاربندی و با تسمه/زنجیر ایمن شد.'),
    (v_trip_id, 'WAYBILL_SEALED', 'صدور بارنامه و پلمپ هوشمند', 'بارنامه الکترونیک صادر و پلمپ هوشمند TLD نصب شد.'),
    (v_trip_id, 'ARRIVED_DEST', 'رسیدن به مقصد', 'خودرو به محل تخلیه در مقصد رسید.'),
    (v_trip_id, 'SMART_LOCK_RELEASED', 'بازگشایی قفل هوشمند در مقصد', 'قفل هوشمند پس از تأیید کد تحویل باز شد.'),
    (v_trip_id, 'UNLOADED', 'تخلیه بار', 'عملیات تخلیه بار تکمیل شد.')
  ON CONFLICT (trip_id, stage) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type, entity_id)
  VALUES (
    v_bid.driver_id,
    'پیشنهاد متقابل پذیرفته شد',
    'شما پیشنهاد متقابل صاحب بار برای محموله «' || v_cargo.title || '» را پذیرفتید. کرایه توافقی: ' ||
      v_bid.counter_offer_tomans::text || ' تومان.',
    'CARGO', 'SUCCESS', 'CARGO', v_cargo.id
  );

  RETURN jsonb_build_object(
    'cargo_id', v_cargo.id,
    'driver_id', v_bid.driver_id,
    'agreed_fare_tomans', v_bid.counter_offer_tomans,
    'trip_id', v_trip_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_counter_offer(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_counter_offer(uuid, uuid) TO service_role;

-- ============================================================
-- 5. confirm_delivery_and_settle: چرخه سفر و محموله هم بسته می‌شود
--    (نسخه کامل ۳ آرگومانی، جایگزین نسخه قبلی)
-- ============================================================
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

  -- مقایسه <> با NULL نتیجه NULL می‌دهد (نه true) و باعث می‌شد درخواست بدون کد
  -- تحویل، وجه امانی را آزاد کند. از IS DISTINCT FROM استفاده می‌کنیم.
  IF p_otp IS NULL OR e.delivery_otp IS DISTINCT FROM trim(p_otp) THEN
    UPDATE public.escrow_accounts
       SET otp_failed_attempts = otp_failed_attempts + 1
     WHERE id = e.id;
    RETURN jsonb_build_object('status', 'INVALID_OTP', 'attempts_left', greatest(0, 4 - e.otp_failed_attempts));
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

  -- مدل مالی مصوب: کارمزد ۵٪ + ۹٪ VAT بر عهده صاحب بار است و از کرایه راننده
  -- کسر نمی‌شود؛ بنابراین commission_amount راننده صفر و خالص = کرایه کامل است.
  INSERT INTO public.driver_earnings (
    driver_id, cargo_id, gross_fare_amount, commission_amount,
    toll_deduction_amount, net_earnings_amount, date, status
  ) VALUES (
    e.driver_id, p_cargo_id, e.freight_amount_tomans, 0,
    0, e.freight_amount_tomans, to_char(now(), 'YYYY/MM/DD'), 'PAID'
  );

  INSERT INTO public.platform_revenue_ledger (
    escrow_id, cargo_id, commission_amount_tomans, vat_amount_tomans, total_platform_cut_tomans
  ) VALUES (
    e.id, p_cargo_id, e.commission_amount_tomans, e.vat_amount_tomans,
    e.commission_amount_tomans + e.vat_amount_tomans
  );

  -- چرخه سفر و محموله را ببند (قبلاً انجام نمی‌شد و محموله DRIVER_ASSIGNED می‌ماند)
  UPDATE public.cargos
     SET status = 'DELIVERED', updated_at = now()
   WHERE id = p_cargo_id
     AND status IN ('DRIVER_ASSIGNED', 'LOADING', 'IN_TRANSIT');

  UPDATE public.transport_trips
     SET status = 'COMPLETED', progress_percentage = 100, updated_at = now()
   WHERE cargo_id = p_cargo_id;

  UPDATE public.drivers
     SET total_trips = total_trips + 1,
         is_available = true,
         updated_at = now()
   WHERE profile_id = e.driver_id;

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

-- ============================================================
-- 6. profiles_public: نمایش امن نام طرف مقابل (راننده/صاحب بار)
-- ============================================================
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS
SELECT
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  p.company_name,
  p.fleet_type,
  p.truck_model,
  p.plate_number,
  p.province,
  p.city,
  p.verification_status,
  p.created_at
FROM public.profiles p
WHERE p.user_id IS NOT NULL;

REVOKE ALL ON public.profiles_public FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- ============================================================
-- 7. notifications: جلوگیری از ارسال اعلان عمومی توسط کاربران
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_own_or_broadcast" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. request_payout: کسر اتمی موجودی + ثبت درخواست تسویه
-- ============================================================
CREATE OR REPLACE FUNCTION public.request_payout(
  p_amount bigint,
  p_iban text,
  p_bank_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_balance bigint;
  v_ref text;
  v_tracking text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  SELECT balance_tomans INTO v_balance
  FROM public.wallets WHERE user_id = v_uid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_WALLET';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE public.wallets
     SET balance_tomans = balance_tomans - p_amount,
         updated_at = now()
   WHERE user_id = v_uid;

  v_ref := 'PAYA-' || floor(random() * 90000000 + 10000000)::bigint::text;
  v_tracking := 'TRK-' || floor(random() * 90000000 + 10000000)::bigint::text;

  INSERT INTO public.wallet_transactions (user_id, title, amount_tomans, type, related_entity_id)
  VALUES (v_uid, 'درخواست تسویه به حساب بانکی', p_amount, 'DEBIT', v_ref);

  INSERT INTO public.driver_settlements (
    driver_id, settlement_reference, amount, iban, bank_name, transfer_type, status, paya_tracking_code
  ) VALUES (
    v_uid, v_ref, p_amount, p_iban, p_bank_name, 'PAYA', 'PROCESSING', v_tracking
  ) RETURNING id INTO v_id;

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type)
  VALUES (
    v_uid,
    'درخواست تسویه ثبت شد',
    'درخواست تسویه به مبلغ ' || p_amount::text || ' تومان ثبت شد و در سیکل بعدی پایا واریز می‌شود.',
    'FINANCIAL', 'INFO', 'WALLET'
  );

  RETURN jsonb_build_object(
    'settlement_id', v_id,
    'settlement_reference', v_ref,
    'paya_tracking_code', v_tracking,
    'remaining_balance_tomans', v_balance - p_amount
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_payout(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_payout(bigint, text, text) TO authenticated;

-- درج مستقیم در driver_settlements دیگر مجاز نیست؛ فقط از مسیر تابع بالا.
REVOKE INSERT ON public.driver_settlements FROM authenticated;

-- ============================================================
-- 9. create_escrow_hold: جلوگیری از بازگشایی مجدد اسکروی تسویه‌شده
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_escrow_hold(
  p_actor_id uuid,
  p_cargo_id text,
  p_driver_id uuid,
  p_freight_amount_tomans bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := p_actor_id;
  v_cargo public.cargos%ROWTYPE;
  v_commission bigint;
  v_vat bigint;
  v_otp text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF p_cargo_id IS NULL OR length(trim(p_cargo_id)) = 0 THEN
    RAISE EXCEPTION 'INVALID_CARGO';
  END IF;
  IF p_freight_amount_tomans IS NULL OR p_freight_amount_tomans <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;
  IF p_driver_id IS NULL OR p_driver_id = v_uid THEN
    RAISE EXCEPTION 'INVALID_DRIVER';
  END IF;

  -- اگر این محموله قبلاً تسویه شده باشد، ساخت اسکروی جدید به پرداخت دوباره
  -- کرایه به راننده منجر می‌شد.
  IF EXISTS (
    SELECT 1 FROM public.escrow_accounts
    WHERE cargo_id = p_cargo_id AND status = 'RELEASED_TO_DRIVER'
  ) THEN
    RAISE EXCEPTION 'ALREADY_SETTLED';
  END IF;

  SELECT * INTO v_cargo FROM public.cargos WHERE id = p_cargo_id;
  IF NOT FOUND OR v_cargo.shipper_id <> v_uid OR v_cargo.assigned_driver_id IS DISTINCT FROM p_driver_id THEN
    RAISE EXCEPTION 'INVALID_CARGO';
  END IF;
  IF v_cargo.agreed_fare_tomans IS DISTINCT FROM p_freight_amount_tomans THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  v_commission := round(p_freight_amount_tomans * 5 / 100.0);
  v_vat := round(v_commission * 9 / 100.0);
  v_otp := lpad(floor(random() * 1000000)::int::text, 6, '0');

  INSERT INTO public.escrow_accounts (
    cargo_id, shipper_id, driver_id, freight_amount_tomans,
    commission_amount_tomans, vat_amount_tomans, total_hold_amount_tomans, delivery_otp
  ) VALUES (
    p_cargo_id, v_uid, p_driver_id, p_freight_amount_tomans,
    v_commission, v_vat, p_freight_amount_tomans + v_commission + v_vat, v_otp
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'escrow_id', v_id,
    'delivery_otp', v_otp,
    'total_hold_amount_tomans', p_freight_amount_tomans + v_commission + v_vat
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'ESCROW_ALREADY_OPEN';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_escrow_hold(uuid, text, uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_escrow_hold(uuid, text, uuid, bigint) TO service_role;

-- ============================================================
-- 10. رفع وابستگی‌های FK به profiles که باعث شکست کل تسویه می‌شد
-- ============================================================
ALTER TABLE public.driver_earnings DROP CONSTRAINT IF EXISTS driver_earnings_driver_id_fkey;
ALTER TABLE public.driver_earnings
  ADD CONSTRAINT driver_earnings_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- ============================================================
-- 11. کیف پول خودکار برای هر کاربر جدید
-- ============================================================
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

  INSERT INTO public.wallets (user_id, balance_tomans)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 12. اعلان‌های عمومی: امکان خوانده‌شدن توسط کاربر
-- ============================================================
DROP POLICY IF EXISTS "notifications_update_broadcast_read" ON public.notifications;
CREATE POLICY "notifications_update_broadcast_read" ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- ============================================================
-- 13. فعال‌سازی Realtime روی جداول مورد استفاده اپ
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.notifications, public.cargos, public.transport_trips;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END IF;
END
$$;

-- ============================================================
-- 14. محدودکردن تغییر وضعیت پیشنهاد توسط راننده
--     راننده فقط می‌تواند پیشنهاد خودش را لغو کند؛ پذیرش/قیمت‌گذاری فقط
--     از طریق توابع سرور انجام می‌شود (قبلاً می‌توانست خودش ACCEPTED بزند).
-- ============================================================
DROP POLICY IF EXISTS "cargo_bids_driver_update_own_status" ON public.cargo_bids;
CREATE POLICY "cargo_bids_driver_cancel_own" ON public.cargo_bids FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid() AND status = 'CANCELLED');

-- ============================================================
-- 15. get_delivery_otp: بازیابی امن کد تحویل فقط توسط صاحب بار
--     تا کد تحویل در localStorage (قابل خواندن با XSS) ذخیره نشود.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_delivery_otp(p_cargo_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_otp text;
  v_expired boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT e.delivery_otp
    INTO v_otp
    FROM public.escrow_accounts e
   WHERE e.cargo_id = p_cargo_id
     AND e.shipper_id = v_uid
   ORDER BY e.created_at DESC
   LIMIT 1;

  IF v_otp IS NULL THEN
    RETURN jsonb_build_object('status', 'NOT_FOUND');
  END IF;

  RETURN jsonb_build_object('status', 'OK', 'delivery_otp', v_otp);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_delivery_otp(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_delivery_otp(text) TO authenticated;
