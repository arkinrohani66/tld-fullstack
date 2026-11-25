/*
# Accept a driver bid and check cargo ownership in escrow

1. New Function
- `accept_driver_bid(p_actor_id, p_cargo_id, p_bid_id)`: the cargo's shipper accepts one pending driver bid. The cargo is assigned to that driver, the agreed fare is set from the bid, and the other pending bids on the cargo are rejected.

2. Updated Function
- `create_escrow_hold` now only opens escrow when the caller owns the cargo, the cargo is assigned to the given driver, and the freight amount equals the agreed fare. Otherwise it returns a generic error.

3. Security
- Both functions are SECURITY DEFINER with a fixed search path.
- Both are callable only by the server role. Signed-in clients reach them through server functions that verify the caller.
- Statements are idempotent so this migration can be safely re-run.
*/

CREATE OR REPLACE FUNCTION public.accept_driver_bid(p_actor_id uuid, p_cargo_id text, p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cargo cargos%ROWTYPE;
  v_bid cargo_bids%ROWTYPE;
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

  RETURN jsonb_build_object(
    'cargo_id', p_cargo_id,
    'driver_id', v_bid.driver_id,
    'agreed_fare_tomans', v_bid.proposed_fare_tomans
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.accept_driver_bid(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_driver_bid(uuid, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.create_escrow_hold(p_actor_id uuid, p_cargo_id text, p_driver_id uuid, p_freight_amount_tomans bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := p_actor_id;
  v_cargo cargos%ROWTYPE;
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
$function$;
