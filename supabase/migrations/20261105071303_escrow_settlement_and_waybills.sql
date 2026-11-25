/*
# Escrow settlement, driver wallets, platform commission ledger and waybill registry

1. New Tables
- `wallets`: one balance row per signed-in user (drivers receive freight here).
- `wallet_transactions`: credit history shown to the owner of each wallet.
- `escrow_accounts`: money held for one cargo. Holds the freight, the 5% platform commission, the 9% VAT on that commission, and the 6-digit delivery code. Status is HELD_SECURE until the delivery is confirmed, then RELEASED_TO_DRIVER.
- `platform_revenue_ledger`: one row per released escrow recording the platform's commission and VAT.
- `waybills`: registry of issued waybill codes used for QR verification.

2. Security
- RLS enabled on every table.
- wallets and wallet_transactions: owner can read only their own rows. No client writes.
- escrow_accounts: shipper and driver can read their own escrows. The delivery code column is NOT readable by clients.
- platform_revenue_ledger and waybills: no direct client access at all.
- Settlement and lookup happen only through functions that check the caller's identity.

3. Functions
- create_escrow_hold: shipper opens a hold for a cargo and receives the delivery code once.
- confirm_delivery_and_settle: shipper confirms delivery with the code. On success, freight goes to the driver wallet and commission + VAT go to the platform ledger, in one transaction. After 5 wrong codes the hold is locked.
- lookup_waybill: returns only non-sensitive waybill fields for a scanned code.

4. Important Notes
- Commission is 5% of freight and VAT is 9% of commission, matching the existing platform rules.
- Insurance premium is not included in this settlement.
- Money movement to bank accounts is not performed here; the ledger records what the platform is owed.
*/

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_tomans bigint NOT NULL DEFAULT 0 CHECK (balance_tomans >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount_tomans bigint NOT NULL CHECK (amount_tomans > 0),
  type text NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  related_entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON public.wallet_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id text NOT NULL,
  shipper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  freight_amount_tomans bigint NOT NULL CHECK (freight_amount_tomans > 0),
  commission_amount_tomans bigint NOT NULL CHECK (commission_amount_tomans >= 0),
  vat_amount_tomans bigint NOT NULL CHECK (vat_amount_tomans >= 0),
  total_hold_amount_tomans bigint NOT NULL CHECK (total_hold_amount_tomans > 0),
  delivery_otp text NOT NULL,
  otp_failed_attempts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'HELD_SECURE' CHECK (status IN ('HELD_SECURE', 'RELEASED_TO_DRIVER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_escrow_per_cargo ON public.escrow_accounts(cargo_id) WHERE status = 'HELD_SECURE';

CREATE TABLE IF NOT EXISTS public.platform_revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid NOT NULL UNIQUE REFERENCES public.escrow_accounts(id) ON DELETE RESTRICT,
  cargo_id text NOT NULL,
  commission_amount_tomans bigint NOT NULL,
  vat_amount_tomans bigint NOT NULL,
  total_platform_cut_tomans bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waybills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waybill_code text UNIQUE NOT NULL,
  cargo_id text,
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  shipper_name text,
  weight_tons numeric(6, 2),
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
  issued_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybills ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.wallets, public.wallet_transactions, public.escrow_accounts, public.platform_revenue_ledger, public.waybills FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT SELECT (id, cargo_id, shipper_id, driver_id, freight_amount_tomans, commission_amount_tomans, vat_amount_tomans, total_hold_amount_tomans, status, created_at, released_at)
  ON public.escrow_accounts TO authenticated;

DROP POLICY IF EXISTS "wallet_select_own" ON public.wallets;
CREATE POLICY "wallet_select_own" ON public.wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "escrow_select_participants" ON public.escrow_accounts;
CREATE POLICY "escrow_select_participants" ON public.escrow_accounts FOR SELECT
  TO authenticated USING (auth.uid() = shipper_id OR auth.uid() = driver_id);

CREATE OR REPLACE FUNCTION public.create_escrow_hold(
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
  v_uid uuid := auth.uid();
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

CREATE OR REPLACE FUNCTION public.confirm_delivery_and_settle(p_cargo_id text, p_otp text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
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

CREATE OR REPLACE FUNCTION public.lookup_waybill(p_code text)
RETURNS TABLE (
  waybill_code text,
  origin_city text,
  destination_city text,
  shipper_name text,
  weight_tons numeric,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.waybill_code, w.origin_city, w.destination_city, w.shipper_name, w.weight_tons, w.status
  FROM public.waybills w
  WHERE w.waybill_code = trim(p_code)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.create_escrow_hold(text, uuid, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_delivery_and_settle(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_waybill(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_escrow_hold(text, uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_delivery_and_settle(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_waybill(text) TO authenticated;
