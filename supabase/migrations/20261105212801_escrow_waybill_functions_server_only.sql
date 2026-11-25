/*
# Escrow and waybill functions callable only by the server

1. Modified Functions
- `create_escrow_hold` now takes the signed-in shipper's id as `p_actor_id`, instead of reading it from the caller's session.
- `confirm_delivery_and_settle` now takes the signed-in shipper's id as `p_actor_id`, instead of reading it from the caller's session.
- `lookup_waybill` keeps its behavior but is no longer callable by signed-in users directly.

2. Security
- Signed-in users, anonymous users, and the public role can no longer run these three functions directly through the data API.
- Only the server role can run them. The server checks who the caller is before passing `p_actor_id`.
- The old versions of the two escrow functions are removed and replaced by the new versions with the actor argument.

3. Important Notes
- No data is changed or removed. Escrow, wallet, ledger, and waybill rows stay as they are.
- The app must call these functions through the new server functions, not directly.
*/

DROP FUNCTION IF EXISTS public.create_escrow_hold(text, uuid, bigint);
DROP FUNCTION IF EXISTS public.confirm_delivery_and_settle(text, text);

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

  IF NOT FOUND OR e.shipper_id <> v_uid THEN
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

  INSERT INTO public.platform_revenue_ledger (
    escrow_id, cargo_id, commission_amount_tomans, vat_amount_tomans, total_platform_cut_tomans
  ) VALUES (
    e.id, p_cargo_id, e.commission_amount_tomans, e.vat_amount_tomans,
    e.commission_amount_tomans + e.vat_amount_tomans
  );

  RETURN jsonb_build_object(
    'status', 'RELEASED',
    'driver_credit_tomans', e.freight_amount_tomans,
    'platform_commission_tomans', e.commission_amount_tomans,
    'platform_vat_tomans', e.vat_amount_tomans
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_escrow_hold(uuid, text, uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_delivery_and_settle(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_waybill(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_escrow_hold(uuid, text, uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_delivery_and_settle(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lookup_waybill(text) TO service_role;
