-- ============================================================
-- TLD Logistics — اجرای یکجای دو migration جدید
-- پروژه: xucsgbapstfcftwrurhy
-- این فایل = 20261109120000 + 20261109140000
-- در Supabase → SQL Editor → New query → Paste → Run
-- ============================================================
/*
# TLD â€” cargo lifecycle, counter-offer flow and counterparty visibility fixes

ط§غŒظ† migration ط¨ط§ع¯â€Œظ‡ط§غŒ ط³ط§ط®طھط§ط±غŒ ط²غŒط± ط±ط§ ط±ظپط¹ ظ…غŒâ€Œع©ظ†ط¯ (ظ‚ط§ط¨ظ„ ط§ط¬ط±ط§غŒ ظ…ط¬ط¯ط¯ / idempotent):

1. `cargos.id` ظ‡غŒع† ظ…ظ‚ط¯ط§ط± ظ¾غŒط´â€Œظپط±ط¶غŒ ظ†ط¯ط§ط´طھطŒ ط¨ظ†ط§ط¨ط±ط§غŒظ† ظ‡ط± insert ط¨ط¯ظˆظ† id
   (cargoService.addCargo) ط¨ط§ ط®ط·ط§غŒ not-null ط´ع©ط³طھ ظ…غŒâ€Œط®ظˆط±ط¯. ط§ع©ظ†ظˆظ† ظ¾غŒط´â€Œظپط±ط¶ ط¯ط§ط±ط¯.
2. CHECK ظˆط¶ط¹غŒطھ `cargos` ظپظ‚ط· PENDING_DRIVER/DRIVER_ASSIGNED/CANCELLED ط±ط§ ظ…غŒâ€Œظ¾ط°غŒط±ظپطھط›
   ط¨ظ†ط§ط¨ط±ط§غŒظ† ظ‡ط± ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط¨ظ‡ IN_TRANSIT / LOADING / DELIVERED ط®ط·ط§ ظ…غŒâ€Œط¯ط§ط¯ ظˆ ع†ط±ط®ظ‡ ط³ظپط±
   ظ†ط§طھظ…ط§ظ… ظ…غŒâ€Œظ…ط§ظ†ط¯. ظ…ظ‚ط¯ط§ط±ظ‡ط§غŒ ع†ط±ط®ظ‡ ع©ط§ظ…ظ„ ط§ط¶ط§ظپظ‡ ط´ط¯.
3. `cargo_bids` ط³طھظˆظ†â€Œظ‡ط§غŒ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ ظˆ ظˆط¶ط¹غŒطھ COUNTER_OFFER ط±ط§ ظ†ط¯ط§ط±ط¯ط› ط¯ع©ظ…ظ‡
   آ«ظ¾ط°غŒط±ط´ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„آ» ط¯ط± ط§ظ¾ ط±ظˆغŒ ع†ظ†غŒظ† ظˆط¶ط¹غŒطھغŒ ظ‡غŒع†â€Œظˆظ‚طھ ظپط¹ط§ظ„ ظ†ظ…غŒâ€Œط´ط¯.
   ط³طھظˆظ†â€Œظ‡ط§ + ظ…ط¬ظˆط² طµط§ط­ط¨ ط¨ط§ط± ط¨ط±ط§غŒ ط«ط¨طھ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ + طھط§ط¨ط¹ ظ¾ط°غŒط±ط´ ط±ط§ظ†ظ†ط¯ظ‡ ط§ط¶ط§ظپظ‡ ط´ط¯.
4. `confirm_delivery_and_settle` ظˆط¶ط¹غŒطھ ظ…ط­ظ…ظˆظ„ظ‡ ظˆ ط³ظپط± ط±ط§ ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ظ†ظ…غŒâ€Œع©ط±ط¯ط› ظ…ط­ظ…ظˆظ„ظ‡
   ط¨ط±ط§غŒ ظ‡ظ…غŒط´ظ‡ DRIVER_ASSIGNED ظ…غŒâ€Œظ…ط§ظ†ط¯. ط§ع©ظ†ظˆظ† DELIVERED / COMPLETED ظ…غŒâ€Œط´ظˆط¯.
5. ط³غŒط§ط³طھ RLS ط±ظˆغŒ `profiles` ط§ط¬ط§ط²ظ‡ ط®ظˆط§ظ†ط¯ظ† ظ¾ط±ظˆظپط§غŒظ„ ط·ط±ظپ ظ…ظ‚ط§ط¨ظ„ ط±ط§ ظ†ظ…غŒâ€Œط¯ط§ط¯طŒ ط¯ط± ظ†طھغŒط¬ظ‡ ظ†ط§ظ…
   ط±ط§ظ†ظ†ط¯ظ‡ ط¯ط± ع©ط§ط±طھ ظ¾غŒط´ظ†ظ‡ط§ط¯ظ‡ط§غŒ طµط§ط­ط¨ ط¨ط§ط± ط®ط§ظ„غŒ ظ…غŒâ€Œظ…ط§ظ†ط¯. ظˆغŒظˆ `profiles_public` ط¨ط§ ظپظ‚ط·
   ط³طھظˆظ†â€Œظ‡ط§غŒ ط؛غŒط±ط­ط³ط§ط³ ط§ط¶ط§ظپظ‡ ط´ط¯.
6. ظ‡ط± ع©ط§ط±ط¨ط± ظˆط§ط±ط¯ط´ط¯ظ‡ ظ…غŒâ€Œطھظˆط§ظ†ط³طھ ط§ط¹ظ„ط§ظ† ط¹ظ…ظˆظ…غŒ (user_id IS NULL) ط¨ط±ط§غŒ ظ‡ظ…ظ‡ ط¯ط±ط¬ ع©ظ†ط¯. ظ…ط­ط¯ظˆط¯ ط´ط¯.
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

-- طµط§ط­ط¨ ط¨ط§ط± ط¨ط§غŒط¯ ط¨طھظˆط§ظ†ط¯ ظ…ط­ظ…ظˆظ„ظ‡ ط®ظˆط¯ط´ ط±ط§ ظ„ط؛ظˆ/ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ع©ظ†ط¯ (ظ‚ط¨ظ„ط§ظ‹ ظ‡غŒع† ظ…ط¬ظˆط² UPDATE ظ†ط¨ظˆط¯)
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

-- طµط§ط­ط¨ ط¨ط§ط± ظ…غŒâ€Œطھظˆط§ظ†ط¯ ط±ظˆغŒ ظ¾غŒط´ظ†ظ‡ط§ط¯ظ‡ط§غŒ ظ…ط­ظ…ظˆظ„ظ‡ ط®ظˆط¯ط´ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ ط¨ع¯ط°ط§ط±ط¯
DROP POLICY IF EXISTS "cargo_bids_shipper_counter_offer" ON public.cargo_bids;
CREATE POLICY "cargo_bids_shipper_counter_offer" ON public.cargo_bids FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = cargo_bids.cargo_id AND c.shipper_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cargos c WHERE c.id = cargo_bids.cargo_id AND c.shipper_id = auth.uid()));

-- ============================================================
-- 4. accept_counter_offer: ط±ط§ظ†ظ†ط¯ظ‡ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ طµط§ط­ط¨ ط¨ط§ط± ط±ط§ ظ…غŒâ€Œظ¾ط°غŒط±ط¯
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
    (v_trip_id, 'LOADING_STARTED', 'ط±ط³غŒط¯ظ† ط¨ظ‡ ظ…ط¨ط¯ط£ ظˆ ط´ط±ظˆط¹ ط¨ط§ط±ع¯غŒط±غŒ', 'ط±ط§ظ†ظ†ط¯ظ‡ ط¯ط± ظ…ط¨ط¯ط£ ط­ط§ط¶ط± ظˆ ط¹ظ…ظ„غŒط§طھ ط¨ط§ط±ع¯غŒط±غŒ ط¢ط؛ط§ط² ط´ط¯.'),
    (v_trip_id, 'CARGO_SECURED', 'ظ…ظ‡ط§ط±ط¨ظ†ط¯غŒ ظˆ ط§غŒظ…ظ†â€Œط³ط§ط²غŒ ط¨ط§ط±', 'ط¨ط§ط± ظ…ظ‡ط§ط±ط¨ظ†ط¯غŒ ظˆ ط¨ط§ طھط³ظ…ظ‡/ط²ظ†ط¬غŒط± ط§غŒظ…ظ† ط´ط¯.'),
    (v_trip_id, 'WAYBILL_SEALED', 'طµط¯ظˆط± ط¨ط§ط±ظ†ط§ظ…ظ‡ ظˆ ظ¾ظ„ظ…ظ¾ ظ‡ظˆط´ظ…ظ†ط¯', 'ط¨ط§ط±ظ†ط§ظ…ظ‡ ط§ظ„ع©طھط±ظˆظ†غŒع© طµط§ط¯ط± ظˆ ظ¾ظ„ظ…ظ¾ ظ‡ظˆط´ظ…ظ†ط¯ TLD ظ†طµط¨ ط´ط¯.'),
    (v_trip_id, 'ARRIVED_DEST', 'ط±ط³غŒط¯ظ† ط¨ظ‡ ظ…ظ‚طµط¯', 'ط®ظˆط¯ط±ظˆ ط¨ظ‡ ظ…ط­ظ„ طھط®ظ„غŒظ‡ ط¯ط± ظ…ظ‚طµط¯ ط±ط³غŒط¯.'),
    (v_trip_id, 'SMART_LOCK_RELEASED', 'ط¨ط§ط²ع¯ط´ط§غŒغŒ ظ‚ظپظ„ ظ‡ظˆط´ظ…ظ†ط¯ ط¯ط± ظ…ظ‚طµط¯', 'ظ‚ظپظ„ ظ‡ظˆط´ظ…ظ†ط¯ ظ¾ط³ ط§ط² طھط£غŒغŒط¯ ع©ط¯ طھط­ظˆغŒظ„ ط¨ط§ط² ط´ط¯.'),
    (v_trip_id, 'UNLOADED', 'طھط®ظ„غŒظ‡ ط¨ط§ط±', 'ط¹ظ…ظ„غŒط§طھ طھط®ظ„غŒظ‡ ط¨ط§ط± طھع©ظ…غŒظ„ ط´ط¯.')
  ON CONFLICT (trip_id, stage) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type, entity_id)
  VALUES (
    v_bid.driver_id,
    'ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ ظ¾ط°غŒط±ظپطھظ‡ ط´ط¯',
    'ط´ظ…ط§ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„ طµط§ط­ط¨ ط¨ط§ط± ط¨ط±ط§غŒ ظ…ط­ظ…ظˆظ„ظ‡ آ«' || v_cargo.title || 'آ» ط±ط§ ظ¾ط°غŒط±ظپطھغŒط¯. ع©ط±ط§غŒظ‡ طھظˆط§ظپظ‚غŒ: ' ||
      v_bid.counter_offer_tomans::text || ' طھظˆظ…ط§ظ†.',
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
-- 5. confirm_delivery_and_settle: ع†ط±ط®ظ‡ ط³ظپط± ظˆ ظ…ط­ظ…ظˆظ„ظ‡ ظ‡ظ… ط¨ط³طھظ‡ ظ…غŒâ€Œط´ظˆط¯
--    (ظ†ط³ط®ظ‡ ع©ط§ظ…ظ„ غ³ ط¢ط±ع¯ظˆظ…ط§ظ†غŒطŒ ط¬ط§غŒع¯ط²غŒظ† ظ†ط³ط®ظ‡ ظ‚ط¨ظ„غŒ)
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

  -- ظ…ظ‚ط§غŒط³ظ‡ <> ط¨ط§ NULL ظ†طھغŒط¬ظ‡ NULL ظ…غŒâ€Œط¯ظ‡ط¯ (ظ†ظ‡ true) ظˆ ط¨ط§ط¹ط« ظ…غŒâ€Œط´ط¯ ط¯ط±ط®ظˆط§ط³طھ ط¨ط¯ظˆظ† ع©ط¯
  -- طھط­ظˆغŒظ„طŒ ظˆط¬ظ‡ ط§ظ…ط§ظ†غŒ ط±ط§ ط¢ط²ط§ط¯ ع©ظ†ط¯. ط§ط² IS DISTINCT FROM ط§ط³طھظپط§ط¯ظ‡ ظ…غŒâ€Œع©ظ†غŒظ….
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
  VALUES (e.driver_id, 'ط¢ط²ط§ط¯ط³ط§ط²غŒ ع©ط±ط§غŒظ‡ ط¨ط§ط±', e.freight_amount_tomans, 'CREDIT', p_cargo_id);

  -- ظ…ط¯ظ„ ظ…ط§ظ„غŒ ظ…طµظˆط¨: ع©ط§ط±ظ…ط²ط¯ غµظھ + غ¹ظھ VAT ط¨ط± ط¹ظ‡ط¯ظ‡ طµط§ط­ط¨ ط¨ط§ط± ط§ط³طھ ظˆ ط§ط² ع©ط±ط§غŒظ‡ ط±ط§ظ†ظ†ط¯ظ‡
  -- ع©ط³ط± ظ†ظ…غŒâ€Œط´ظˆط¯ط› ط¨ظ†ط§ط¨ط±ط§غŒظ† commission_amount ط±ط§ظ†ظ†ط¯ظ‡ طµظپط± ظˆ ط®ط§ظ„طµ = ع©ط±ط§غŒظ‡ ع©ط§ظ…ظ„ ط§ط³طھ.
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

  -- ع†ط±ط®ظ‡ ط³ظپط± ظˆ ظ…ط­ظ…ظˆظ„ظ‡ ط±ط§ ط¨ط¨ظ†ط¯ (ظ‚ط¨ظ„ط§ظ‹ ط§ظ†ط¬ط§ظ… ظ†ظ…غŒâ€Œط´ط¯ ظˆ ظ…ط­ظ…ظˆظ„ظ‡ DRIVER_ASSIGNED ظ…غŒâ€Œظ…ط§ظ†ط¯)
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
     'ع©ط±ط§غŒظ‡ ط´ظ…ط§ ط¢ط²ط§ط¯ ط´ط¯',
     'ع©ط±ط§غŒظ‡ ظ…ط­ظ…ظˆظ„ظ‡ ط¨ظ‡ ظ…ط¨ظ„ط؛ ' || e.freight_amount_tomans::text || ' طھظˆظ…ط§ظ† ط¨ظ‡ ع©غŒظپ ظ¾ظˆظ„ ط´ظ…ط§ ظˆط§ط±غŒط² ط´ط¯.',
     'FINANCIAL', 'SUCCESS', 'PAYMENT', p_cargo_id),
    (e.shipper_id,
     'طھط­ظˆغŒظ„ ظ…ط­ظ…ظˆظ„ظ‡ طھط£غŒغŒط¯ ط´ط¯',
     'طھط­ظˆغŒظ„ ظˆ طھط³ظˆغŒظ‡ ظ…ط­ظ…ظˆظ„ظ‡ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ظ†ط¬ط§ظ… ط´ط¯ ظˆ ظˆط¬ظ‡ ط§ظ…ط§ظ†غŒ ط¨ظ‡ ط±ط§ظ†ظ†ط¯ظ‡ ط¢ط²ط§ط¯ ع¯ط±ط¯غŒط¯.',
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
-- 6. profiles_public: ظ†ظ…ط§غŒط´ ط§ظ…ظ† ظ†ط§ظ… ط·ط±ظپ ظ…ظ‚ط§ط¨ظ„ (ط±ط§ظ†ظ†ط¯ظ‡/طµط§ط­ط¨ ط¨ط§ط±)
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
-- 7. notifications: ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² ط§ط±ط³ط§ظ„ ط§ط¹ظ„ط§ظ† ط¹ظ…ظˆظ…غŒ طھظˆط³ط· ع©ط§ط±ط¨ط±ط§ظ†
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_own_or_broadcast" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. request_payout: ع©ط³ط± ط§طھظ…غŒ ظ…ظˆط¬ظˆط¯غŒ + ط«ط¨طھ ط¯ط±ط®ظˆط§ط³طھ طھط³ظˆغŒظ‡
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
  VALUES (v_uid, 'ط¯ط±ط®ظˆط§ط³طھ طھط³ظˆغŒظ‡ ط¨ظ‡ ط­ط³ط§ط¨ ط¨ط§ظ†ع©غŒ', p_amount, 'DEBIT', v_ref);

  INSERT INTO public.driver_settlements (
    driver_id, settlement_reference, amount, iban, bank_name, transfer_type, status, paya_tracking_code
  ) VALUES (
    v_uid, v_ref, p_amount, p_iban, p_bank_name, 'PAYA', 'PROCESSING', v_tracking
  ) RETURNING id INTO v_id;

  INSERT INTO public.notifications (user_id, title, message, category, severity, entity_type)
  VALUES (
    v_uid,
    'ط¯ط±ط®ظˆط§ط³طھ طھط³ظˆغŒظ‡ ط«ط¨طھ ط´ط¯',
    'ط¯ط±ط®ظˆط§ط³طھ طھط³ظˆغŒظ‡ ط¨ظ‡ ظ…ط¨ظ„ط؛ ' || p_amount::text || ' طھظˆظ…ط§ظ† ط«ط¨طھ ط´ط¯ ظˆ ط¯ط± ط³غŒع©ظ„ ط¨ط¹ط¯غŒ ظ¾ط§غŒط§ ظˆط§ط±غŒط² ظ…غŒâ€Œط´ظˆط¯.',
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

-- ط¯ط±ط¬ ظ…ط³طھظ‚غŒظ… ط¯ط± driver_settlements ط¯غŒع¯ط± ظ…ط¬ط§ط² ظ†غŒط³طھط› ظپظ‚ط· ط§ط² ظ…ط³غŒط± طھط§ط¨ط¹ ط¨ط§ظ„ط§.
REVOKE INSERT ON public.driver_settlements FROM authenticated;

-- ============================================================
-- 9. create_escrow_hold: ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² ط¨ط§ط²ع¯ط´ط§غŒغŒ ظ…ط¬ط¯ط¯ ط§ط³ع©ط±ظˆغŒ طھط³ظˆغŒظ‡â€Œط´ط¯ظ‡
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

  -- ط§ع¯ط± ط§غŒظ† ظ…ط­ظ…ظˆظ„ظ‡ ظ‚ط¨ظ„ط§ظ‹ طھط³ظˆغŒظ‡ ط´ط¯ظ‡ ط¨ط§ط´ط¯طŒ ط³ط§ط®طھ ط§ط³ع©ط±ظˆغŒ ط¬ط¯غŒط¯ ط¨ظ‡ ظ¾ط±ط¯ط§ط®طھ ط¯ظˆط¨ط§ط±ظ‡
  -- ع©ط±ط§غŒظ‡ ط¨ظ‡ ط±ط§ظ†ظ†ط¯ظ‡ ظ…ظ†ط¬ط± ظ…غŒâ€Œط´ط¯.
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
-- 10. ط±ظپط¹ ظˆط§ط¨ط³طھع¯غŒâ€Œظ‡ط§غŒ FK ط¨ظ‡ profiles ع©ظ‡ ط¨ط§ط¹ط« ط´ع©ط³طھ ع©ظ„ طھط³ظˆغŒظ‡ ظ…غŒâ€Œط´ط¯
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
-- 11. ع©غŒظپ ظ¾ظˆظ„ ط®ظˆط¯ع©ط§ط± ط¨ط±ط§غŒ ظ‡ط± ع©ط§ط±ط¨ط± ط¬ط¯غŒط¯
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
-- 12. ط§ط¹ظ„ط§ظ†â€Œظ‡ط§غŒ ط¹ظ…ظˆظ…غŒ: ط§ظ…ع©ط§ظ† ط®ظˆط§ظ†ط¯ظ‡â€Œط´ط¯ظ† طھظˆط³ط· ع©ط§ط±ط¨ط±
-- ============================================================
DROP POLICY IF EXISTS "notifications_update_broadcast_read" ON public.notifications;
CREATE POLICY "notifications_update_broadcast_read" ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- ============================================================
-- 13. ظپط¹ط§ظ„â€Œط³ط§ط²غŒ Realtime ط±ظˆغŒ ط¬ط¯ط§ظˆظ„ ظ…ظˆط±ط¯ ط§ط³طھظپط§ط¯ظ‡ ط§ظ¾
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
-- 14. ظ…ط­ط¯ظˆط¯ع©ط±ط¯ظ† طھط؛غŒغŒط± ظˆط¶ط¹غŒطھ ظ¾غŒط´ظ†ظ‡ط§ط¯ طھظˆط³ط· ط±ط§ظ†ظ†ط¯ظ‡
--     ط±ط§ظ†ظ†ط¯ظ‡ ظپظ‚ط· ظ…غŒâ€Œطھظˆط§ظ†ط¯ ظ¾غŒط´ظ†ظ‡ط§ط¯ ط®ظˆط¯ط´ ط±ط§ ظ„ط؛ظˆ ع©ظ†ط¯ط› ظ¾ط°غŒط±ط´/ظ‚غŒظ…طھâ€Œع¯ط°ط§ط±غŒ ظپظ‚ط·
--     ط§ط² ط·ط±غŒظ‚ طھظˆط§ط¨ط¹ ط³ط±ظˆط± ط§ظ†ط¬ط§ظ… ظ…غŒâ€Œط´ظˆط¯ (ظ‚ط¨ظ„ط§ظ‹ ظ…غŒâ€Œطھظˆط§ظ†ط³طھ ط®ظˆط¯ط´ ACCEPTED ط¨ط²ظ†ط¯).
-- ============================================================
DROP POLICY IF EXISTS "cargo_bids_driver_update_own_status" ON public.cargo_bids;
CREATE POLICY "cargo_bids_driver_cancel_own" ON public.cargo_bids FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid() AND status = 'CANCELLED');

-- ============================================================
-- 15. get_delivery_otp: ط¨ط§ط²غŒط§ط¨غŒ ط§ظ…ظ† ع©ط¯ طھط­ظˆغŒظ„ ظپظ‚ط· طھظˆط³ط· طµط§ط­ط¨ ط¨ط§ط±
--     طھط§ ع©ط¯ طھط­ظˆغŒظ„ ط¯ط± localStorage (ظ‚ط§ط¨ظ„ ط®ظˆط§ظ†ط¯ظ† ط¨ط§ XSS) ط°ط®غŒط±ظ‡ ظ†ط´ظˆط¯.
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


-- ==================== بخش دوم: Modular Platform Core ====================

/*
# TLD Platform â€” Modular Core (ظ‚ط§ط¨ظ„ طھظˆط³ط¹ظ‡ ط¨ط±ط§غŒ ظ…ط§عکظˆظ„â€Œظ‡ط§غŒ ط¢غŒظ†ط¯ظ‡)

ظ‡ط¯ظپ: ط³ط§ط®طھ غŒع© ظ„ط§غŒظ‡ آ«ظ¾ظ„طھظپط±ظ…غŒآ» ط±ظˆغŒ ط¬ط¯ط§ظˆظ„ ظ…ظˆط¬ظˆط¯طŒ ط¨ظ‡â€Œع¯ظˆظ†ظ‡â€Œط§غŒ ع©ظ‡ ط§ظپط²ظˆط¯ظ† ط¨ط®ط´â€Œظ‡ط§غŒ ط¬ط¯غŒط¯
(ظ…ط§عکظˆظ„ ط¬ط¯غŒط¯طŒ ظˆط¶ط¹غŒطھ ط¬ط¯غŒط¯طŒ طھظ†ط¸غŒظ…ط§طھ ط¬ط¯غŒط¯طŒ ط¯ط³طھط±ط³غŒ ط¬ط¯غŒط¯) ط¨ط¯ظˆظ† ط¨ط§ط²ظ†ظˆغŒط³غŒ ط§ط³ع©غŒظ…ط§ ظˆ طµط±ظپط§ظ‹
ط¨ط§ غŒع© migration ع©ظˆع†ع© غŒط§ غŒع© ط±ط¯غŒظپ ط¯ط§ط¯ظ‡ ط§ظ†ط¬ط§ظ… ط´ظˆط¯.

ط§ط¬ط²ط§غŒ ط§ط¶ط§ظپظ‡â€Œط´ط¯ظ‡:
1. طھظˆط§ط¨ط¹ ع©ظ…ع©غŒ ط³ط±ط§ط³ط±غŒ: is_admin()طŒ current_role_name()طŒ touch_updated_at()
2. app_settings      â€” طھظ†ط¸غŒظ…ط§طھ ط²ظ…ط§ظ† ط§ط¬ط±ط§ (key/value JSONB) ط¨ط¯ظˆظ† ظ†غŒط§ط² ط¨ظ‡ ط¯غŒظ¾ظ„ظˆغŒ ظ…ط¬ط¯ط¯
3. feature_modules   â€” ظپط¹ط§ظ„/ط؛غŒط±ظپط¹ط§ظ„ ع©ط±ط¯ظ† ظ…ط§عکظˆظ„â€Œظ‡ط§ ظˆ rollout طھط¯ط±غŒط¬غŒ
4. status_definitionsâ€” ظ…ط§ط´غŒظ† ظˆط¶ط¹غŒطھ ظ‚ط§ط¨ظ„ طھظˆط³ط¹ظ‡ (status ط¬ط¯غŒط¯ = غŒع© ط±ط¯غŒظپ ط¯ط§ط¯ظ‡)
5. audit_log         â€” ط«ط¨طھ ظ‡ظ…ظ‡ ط§ظ‚ط¯ط§ظ…ط§طھ ظ…ط¯غŒط±غŒطھغŒ
6. media_assets      â€” ظپط§غŒظ„â€Œظ‡ط§/ظ…ط¯ط§ط±ع© ط¢ظ¾ظ„ظˆط¯غŒ ط¨ظ‡â€Œطµظˆط±طھ غŒع©ظ¾ط§ط±ع†ظ‡
7. policies ط§ط¯ظ…غŒظ†     â€” ط¯ط³طھط±ط³غŒ ط®ظˆط§ظ†ط¯ظ†/ظ†ظˆط´طھظ† ظ…ط¯غŒط± ط±ظˆغŒ ظ‡ظ…ظ‡ ط¬ط¯ط§ظˆظ„ ط¹ظ…ظ„غŒط§طھغŒ
8. seed ط§ظˆظ„غŒظ‡

ظ†ع©طھظ‡: ط§غŒظ† ظپط§غŒظ„ idempotent ط§ط³طھ ظˆ ط¨ط¹ط¯ ط§ط² 20261108103000 ط§ط¬ط±ط§ ظ…غŒâ€Œط´ظˆط¯.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role_name() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated;

-- طھط±غŒع¯ط± ط¹ظ…ظˆظ…غŒ ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ updated_at ع©ظ‡ ط±ظˆغŒ ظ‡ط± ط¬ط¯ظˆظ„ ط¬ط¯غŒط¯غŒ ظ‚ط§ط¨ظ„ ط§طھطµط§ظ„ ط§ط³طھ
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. app_settings â€” طھظ†ط¸غŒظ…ط§طھ ط²ظ…ط§ظ† ط§ط¬ط±ط§
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

DROP POLICY IF EXISTS "app_settings_read_public" ON public.app_settings;
CREATE POLICY "app_settings_read_public" ON public.app_settings FOR SELECT
  TO anon, authenticated USING (is_public OR public.is_admin());

DROP POLICY IF EXISTS "app_settings_admin_write" ON public.app_settings;
CREATE POLICY "app_settings_admin_write" ON public.app_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_app_settings_touch ON public.app_settings;
CREATE TRIGGER trg_app_settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 3. feature_modules â€” ظپط¹ط§ظ„â€Œط³ط§ط²غŒ ظ…ط§عکظˆظ„â€Œظ‡ط§
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_modules (
  code text PRIMARY KEY,
  name_fa text NOT NULL,
  name_en text,
  name_tr text,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_modules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feature_modules FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.feature_modules TO anon, authenticated;
GRANT ALL ON public.feature_modules TO service_role;

DROP POLICY IF EXISTS "feature_modules_read" ON public.feature_modules;
CREATE POLICY "feature_modules_read" ON public.feature_modules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "feature_modules_admin_write" ON public.feature_modules;
CREATE POLICY "feature_modules_admin_write" ON public.feature_modules FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_feature_modules_touch ON public.feature_modules;
CREATE TRIGGER trg_feature_modules_touch BEFORE UPDATE ON public.feature_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 4. status_definitions â€” ظ…ط§ط´غŒظ† ظˆط¶ط¹غŒطھ ظ‚ط§ط¨ظ„ طھظˆط³ط¹ظ‡
--    ط§ظپط²ظˆط¯ظ† ظˆط¶ط¹غŒطھ ط¬ط¯غŒط¯ ط¯ط± ط¢غŒظ†ط¯ظ‡ = غŒع© INSERTطŒ ظ†ظ‡ طھط؛غŒغŒط± CHECK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.status_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  code text NOT NULL,
  label_fa text NOT NULL,
  label_en text,
  label_tr text,
  color text DEFAULT '#747686',
  sort_order integer NOT NULL DEFAULT 100,
  is_terminal boolean NOT NULL DEFAULT false,
  allowed_next text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity, code)
);

ALTER TABLE public.status_definitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.status_definitions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.status_definitions TO anon, authenticated;
GRANT ALL ON public.status_definitions TO service_role;

DROP POLICY IF EXISTS "status_definitions_read" ON public.status_definitions;
CREATE POLICY "status_definitions_read" ON public.status_definitions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "status_definitions_admin_write" ON public.status_definitions;
CREATE POLICY "status_definitions_admin_write" ON public.status_definitions FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. audit_log â€” ط±ط¯ع¯غŒط±غŒ ط§ظ‚ط¯ط§ظ…ط§طھ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  entity text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============================================================
-- 6. media_assets â€” غŒع©ظ¾ط§ط±ع†ظ‡â€Œط³ط§ط²غŒ ظپط§غŒظ„â€Œظ‡ط§ ظˆ ظ…ط¯ط§ط±ع©
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  bucket text NOT NULL DEFAULT 'documents',
  path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'DOCUMENT'
    CHECK (kind IN ('DOCUMENT', 'PHOTO', 'WAYBILL', 'SIGNATURE', 'AVATAR', 'OTHER')),
  entity text,
  entity_id text,
  is_public boolean NOT NULL DEFAULT false,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON public.media_assets (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_entity ON public.media_assets (entity, entity_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.media_assets FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

DROP POLICY IF EXISTS "media_assets_owner_or_admin" ON public.media_assets;
CREATE POLICY "media_assets_owner_or_admin" ON public.media_assets FOR SELECT
  TO authenticated USING (owner_id = auth.uid() OR is_public OR public.is_admin());

DROP POLICY IF EXISTS "media_assets_insert_own" ON public.media_assets;
CREATE POLICY "media_assets_insert_own" ON public.media_assets FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "media_assets_update_own" ON public.media_assets;
CREATE POLICY "media_assets_update_own" ON public.media_assets FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- 7. ADMIN POLICIES â€” ط¯ط³طھط±ط³غŒ ظ…ط¯غŒط± ط¨ظ‡ ط¯ط§ط¯ظ‡ ط¹ظ…ظ„غŒط§طھغŒ
--    (ط¨ط¯ظˆظ† ط§غŒظ†â€Œظ‡ط§ ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ ظˆط¨ ظ‡غŒع† ط±ط¯غŒظپغŒ ظ†ظ…غŒâ€Œط¨غŒظ†ط¯)
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'drivers', 'shippers', 'shipper_documents', 'cargos', 'cargo_bids',
    'transport_trips', 'trip_locations', 'trip_checkpoints', 'driver_vehicles',
    'driver_earnings', 'driver_settlements', 'driver_disputes', 'driver_reviews',
    'escrow_accounts', 'wallets', 'wallet_transactions', 'platform_revenue_ledger',
    'waybills', 'notifications', 'conversations', 'messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'admin_full_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      'admin_full_' || t, t
    );
  END LOOP;
END
$$;

-- Admin ط¨ط§غŒط¯ ط¨طھظˆط§ظ†ط¯ ظ†ظ‚ط´ ع©ط§ط±ط¨ط± ط±ط§ طھط؛غŒغŒط± ط¯ظ‡ط¯ (ط¨ط±ط§غŒ طھط£غŒغŒط¯/ط±ط¯ ظ…ط¯ط§ط±ع©)
GRANT UPDATE (role, verification_status, rejection_reason, updated_at)
  ON public.profiles TO authenticated;

-- ============================================================
-- 8. SEED
-- ============================================================
INSERT INTO public.app_settings (key, value, description, is_public) VALUES
  ('platform.identity', '{"domain":"tldlogistics.ir","support_phone":"+982191000000","support_email":"support@tldlogistics.ir"}', 'ظ‡ظˆغŒطھ ظˆ ط±ط§ظ‡â€Œظ‡ط§غŒ طھظ…ط§ط³ ظ¾ظ„طھظپط±ظ…', true),
  ('finance.commission', '{"rate_percent":5,"vat_percent":9,"currency":"TOMAN","model":"ON_TOP_OF_FREIGHT"}', 'ظ†ط±ط® ع©ط§ط±ظ…ط²ط¯ ظˆ ظ…ط§ظ„غŒط§طھ ظ¾ظ„طھظپط±ظ…', true),
  ('finance.escrow', '{"otp_length":6,"max_otp_attempts":5,"auto_release_hours":72}', 'طھظ†ط¸غŒظ…ط§طھ ط­ط³ط§ط¨ ط§ظ…ط§ظ†غŒ', false),
  ('limits.cargo', '{"max_weight_tons":40,"min_fare_tomans":500000}', 'ظ…ط­ط¯ظˆط¯غŒطھâ€Œظ‡ط§غŒ ط«ط¨طھ ط¨ط§ط±', true),
  ('locales', '{"default":"fa","supported":["fa","en","tr"]}', 'ط²ط¨ط§ظ†â€Œظ‡ط§غŒ ظ¾ط´طھغŒط¨ط§ظ†غŒâ€Œط´ط¯ظ‡', true),
  ('maintenance', '{"enabled":false,"message":""}', 'ط­ط§ظ„طھ طھط¹ظ…غŒط±ط§طھ ط³ط§ظ…ط§ظ†ظ‡', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_modules (code, name_fa, name_en, name_tr, description, is_enabled, sort_order) VALUES
  ('auth',        'ط§ط­ط±ط§ط² ظ‡ظˆغŒطھ ظˆ ط«ط¨طھâ€Œظ†ط§ظ…', 'Authentication', 'Kimlik Doؤںrulama', 'ظˆط±ظˆط¯طŒ ط«ط¨طھâ€Œظ†ط§ظ… ظˆ ظ…ط¯غŒط±غŒطھ ظ†ظ‚ط´â€Œظ‡ط§', true, 10),
  ('cargo',       'ط§ط¹ظ„ط§ظ… ط¨ط§ط± ظˆ ظ…ط­ظ…ظˆظ„ظ‡', 'Cargo Posting', 'Yأ¼k ؤ°lanؤ±', 'ط«ط¨طھ ظˆ ظ…ط¯غŒط±غŒطھ ظ…ط­ظ…ظˆظ„ظ‡â€Œظ‡ط§', true, 20),
  ('bidding',     'ظ…ظ†ط§ظ‚طµظ‡ ظˆ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ‚غŒظ…طھ', 'Bidding', 'Teklif Sistemi', 'ظ¾غŒط´ظ†ظ‡ط§ط¯ ط±ط§ظ†ظ†ط¯ع¯ط§ظ† ظˆ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„', true, 30),
  ('contract',    'ظ‚ط±ط§ط±ط¯ط§ط¯ ط¯غŒط¬غŒطھط§ظ„', 'Digital Contract', 'Dijital Sأ¶zleإںme', 'ظ‚ط±ط§ط±ط¯ط§ط¯ ظˆ ط§ظ…ط¶ط§غŒ ط§ظ„ع©طھط±ظˆظ†غŒع©', true, 40),
  ('escrow',      'ط­ط³ط§ط¨ ط§ظ…ط§ظ†غŒ', 'Escrow', 'Emanet Hesabؤ±', 'ظ…ط³ط¯ظˆط¯ط³ط§ط²غŒ ظˆ ط¢ط²ط§ط¯ط³ط§ط²غŒ ظˆط¬ظ‡', true, 50),
  ('settlement',  'طھط³ظˆغŒظ‡ ظˆ ع©غŒظپ ظ¾ظˆظ„', 'Settlement & Wallet', 'أ–deme ve Cأ¼zdan', 'ع©غŒظپ ظ¾ظˆظ„طŒ طھط³ظˆغŒظ‡ ظˆ ط¯ط±ع¯ط§ظ‡', true, 60),
  ('trips',       'ط³ظپط± ظˆ ط±ظ‡ع¯غŒط±غŒ', 'Trips & Tracking', 'Sefer ve Takip', 'ع†ط±ط®ظ‡ ط³ظپط±طŒ ع†ع©â€Œظ¾ظˆغŒظ†طھ ظˆ ظ…ظˆظ‚ط¹غŒطھ', true, 70),
  ('waybill',     'ط¨ط§ط±ظ†ط§ظ…ظ‡ ط§ظ„ع©طھط±ظˆظ†غŒع©', 'E-Waybill', 'e-ؤ°rsaliye', 'طµط¯ظˆط± ظˆ ط§ط¹طھط¨ط§ط±ط³ظ†ط¬غŒ ط¨ط§ط±ظ†ط§ظ…ظ‡', true, 80),
  ('iot',         'طھظ„ظ‡â€Œظ…طھط±غŒ TLD-Box', 'IoT Telemetry', 'IoT Telemetri', 'ط³ظ†ط³ظˆط±ظ‡ط§طŒ ط¯ظ…ط§طŒ ظ¾ظ„ظ…ظ¾ ظ‡ظˆط´ظ…ظ†ط¯', false, 90),
  ('fuel',        'ظ…ط§ظ†غŒطھظˆط±غŒظ†ع¯ ط³ظˆط®طھ', 'Fuel Monitoring', 'Yakؤ±t ؤ°zleme', 'ظ…طµط±ظپ ط³ظˆط®طھ ظˆ ط±ط§ظ†ط¯ظ…ط§ظ†', false, 100),
  ('backhaul',    'ط¨ط§ط± ط¨ط±ع¯ط´طھ', 'Backhaul', 'Dأ¶nأ¼إں Yأ¼kأ¼', 'ظ¾غŒط´ظ†ظ‡ط§ط¯ ط¨ط§ط± ط¨ط±ع¯ط´طھ', false, 110),
  ('disputes',    'ط¯ط§ظˆط±غŒ ظˆ ط§ط®طھظ„ط§ظپط§طھ', 'Disputes', 'Anlaإںmazlؤ±klar', 'ط«ط¨طھ ظˆ ط±ط³غŒط¯ع¯غŒ ط¨ظ‡ ط´ع©ط§غŒط§طھ', true, 120),
  ('chat',        'ع¯ظپطھع¯ظˆ', 'Messaging', 'Mesajlaإںma', 'ع†طھ ط±ط§ظ†ظ†ط¯ظ‡ ظˆ طµط§ط­ط¨ ط¨ط§ط±', true, 130),
  ('ai',          'ط¯ط³طھغŒط§ط± ظ‡ظˆط´ظ…ظ†ط¯', 'AI Assistant', 'Yapay Zekأ¢ Asistanؤ±', 'ط¯ط³طھغŒط§ط± Gemini', false, 140),
  ('admin',       'ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ', 'Admin Console', 'Yأ¶netim Paneli', 'ط§طھط§ظ‚ ظپط±ظ…ط§ظ† ظˆ ظ…ط¯غŒط±غŒطھ ظ¾ظ„طھظپط±ظ…', true, 150)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.status_definitions (entity, code, label_fa, label_en, label_tr, color, sort_order, is_terminal, allowed_next) VALUES
  ('cargo', 'PENDING_DRIVER', 'ط¯ط± ط§ظ†طھط¸ط§ط± ط±ط§ظ†ظ†ط¯ظ‡', 'Waiting for driver', 'Sأ¼rأ¼cأ¼ bekleniyor', '#b27b00', 10, false, ARRAY['DRIVER_ASSIGNED','CANCELLED']),
  ('cargo', 'DRIVER_ASSIGNED', 'ط±ط§ظ†ظ†ط¯ظ‡ طھط®طµغŒطµ غŒط§ظپطھظ‡', 'Driver assigned', 'Sأ¼rأ¼cأ¼ atandؤ±', '#1967d2', 20, false, ARRAY['LOADING','CANCELLED']),
  ('cargo', 'LOADING', 'ط¯ط± ط­ط§ظ„ ط¨ط§ط±ع¯غŒط±غŒ', 'Loading', 'Yأ¼kleniyor', '#0ea5e9', 30, false, ARRAY['IN_TRANSIT','CANCELLED']),
  ('cargo', 'IN_TRANSIT', 'ط¯ط± ظ…ط³غŒط±', 'In transit', 'Yolda', '#6366f1', 40, false, ARRAY['DELIVERED']),
  ('cargo', 'DELIVERED', 'طھط­ظˆغŒظ„ ط´ط¯ظ‡', 'Delivered', 'Teslim edildi', '#00a368', 50, true, ARRAY[]::text[]),
  ('cargo', 'CANCELLED', 'ظ„ط؛ظˆ ط´ط¯ظ‡', 'Cancelled', 'ؤ°ptal edildi', '#ba1a1a', 60, true, ARRAY[]::text[]),
  ('bid', 'PENDING', 'ط¯ط± ط§ظ†طھط¸ط§ط± ط¨ط±ط±ط³غŒ', 'Pending', 'Beklemede', '#b27b00', 10, false, ARRAY['COUNTER_OFFER','ACCEPTED','REJECTED','CANCELLED','EXPIRED']),
  ('bid', 'COUNTER_OFFER', 'ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…طھظ‚ط§ط¨ظ„', 'Counter offer', 'Karإںؤ± teklif', '#1967d2', 20, false, ARRAY['ACCEPTED','CANCELLED','EXPIRED']),
  ('bid', 'ACCEPTED', 'ظ¾ط°غŒط±ظپطھظ‡ ط´ط¯ظ‡', 'Accepted', 'Kabul edildi', '#00a368', 30, true, ARRAY[]::text[]),
  ('bid', 'REJECTED', 'ط±ط¯ ط´ط¯ظ‡', 'Rejected', 'Reddedildi', '#ba1a1a', 40, true, ARRAY[]::text[]),
  ('bid', 'CANCELLED', 'ظ„ط؛ظˆ ط´ط¯ظ‡', 'Cancelled', 'ؤ°ptal edildi', '#5f6368', 50, true, ARRAY[]::text[]),
  ('bid', 'EXPIRED', 'ظ…ظ†ظ‚ط¶غŒ ط´ط¯ظ‡', 'Expired', 'Sأ¼resi doldu', '#5f6368', 60, true, ARRAY[]::text[]),
  ('escrow', 'HELD_SECURE', 'ظ…ط³ط¯ظˆط¯ ظˆ ط§ظ…ظ†', 'Held secure', 'Emanette', '#1967d2', 10, false, ARRAY['RELEASED_TO_DRIVER']),
  ('escrow', 'RELEASED_TO_DRIVER', 'ط¢ط²ط§ط¯ ط´ط¯ظ‡ ط¨ظ‡ ط±ط§ظ†ظ†ط¯ظ‡', 'Released to driver', 'Sأ¼rأ¼cأ¼ye أ¶dendi', '#00a368', 20, true, ARRAY[]::text[]),
  ('trip', 'SCHEDULED', 'ط²ظ…ط§ظ†â€Œط¨ظ†ط¯غŒ ط´ط¯ظ‡', 'Scheduled', 'Planlandؤ±', '#b27b00', 10, false, ARRAY['ACTIVE','DELAYED']),
  ('trip', 'ACTIVE', 'ط¯ط± ط­ط§ظ„ ط§ط¬ط±ط§', 'Active', 'Aktif', '#6366f1', 20, false, ARRAY['COMPLETED','DELAYED']),
  ('trip', 'DELAYED', 'طھط£ط®غŒط±', 'Delayed', 'Gecikmiإں', '#f97316', 30, false, ARRAY['ACTIVE','COMPLETED']),
  ('trip', 'COMPLETED', 'طھع©ظ…غŒظ„ ط´ط¯ظ‡', 'Completed', 'Tamamlandؤ±', '#00a368', 40, true, ARRAY[]::text[]),
  ('dispute', 'SUBMITTED', 'ط«ط¨طھ ط´ط¯ظ‡', 'Submitted', 'Gأ¶nderildi', '#b27b00', 10, false, ARRAY['UNDER_REVIEW']),
  ('dispute', 'UNDER_REVIEW', 'ط¯ط± ط­ط§ظ„ ط¨ط±ط±ط³غŒ', 'Under review', 'ؤ°nceleniyor', '#1967d2', 20, false, ARRAY['APPROVED','REJECTED','RESOLVED_WITH_PAYOUT']),
  ('dispute', 'APPROVED', 'طھط£غŒغŒط¯ ط´ط¯ظ‡', 'Approved', 'Onaylandؤ±', '#00a368', 30, true, ARRAY[]::text[]),
  ('dispute', 'REJECTED', 'ط±ط¯ ط´ط¯ظ‡', 'Rejected', 'Reddedildi', '#ba1a1a', 40, true, ARRAY[]::text[]),
  ('dispute', 'RESOLVED_WITH_PAYOUT', 'ط­ظ„ ط´ط¯ظ‡ ط¨ط§ ظ¾ط±ط¯ط§ط®طھ', 'Resolved with payout', 'أ–deme ile أ§أ¶zأ¼ldأ¼', '#00a368', 50, true, ARRAY[]::text[]),
  ('settlement', 'PENDING', 'ط¯ط± ط§ظ†طھط¸ط§ط±', 'Pending', 'Beklemede', '#b27b00', 10, false, ARRAY['PROCESSING']),
  ('settlement', 'PROCESSING', 'ط¯ط± ط­ط§ظ„ ظˆط§ط±غŒط²', 'Processing', 'ؤ°إںleniyor', '#1967d2', 20, false, ARRAY['SUCCESS']),
  ('settlement', 'SUCCESS', 'ظˆط§ط±غŒط² ط´ط¯', 'Paid out', 'أ–dendi', '#00a368', 30, true, ARRAY[]::text[])
ON CONFLICT (entity, code) DO NOTHING;
