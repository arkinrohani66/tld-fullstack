/*
# Create cargos and cargo bids tables

1. New Tables
- `cargos`: shipper-posted loads with route, weight, truck type, status, agreed fare and assigned driver.
- `cargo_bids`: driver offers on a cargo. One offer per driver per cargo.

2. Security
- RLS enabled on both tables.
- Shippers see their own cargos. Any signed-in user sees open cargos; the assigned driver also sees theirs.
- Drivers see and create only their own bids. Shippers see bids on their own cargos.
- Owner columns default to the signed-in user so clients cannot forge them.
- Assigned driver and agreed fare are not client-writable; they are set by a server function.

3. Notes
- Statements are idempotent so this migration can be safely re-run.
*/

CREATE TABLE IF NOT EXISTS cargos (
  id text PRIMARY KEY,
  shipper_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  weight_tons numeric,
  truck_type text,
  status text NOT NULL DEFAULT 'PENDING_DRIVER' CHECK (status IN ('PENDING_DRIVER', 'DRIVER_ASSIGNED', 'CANCELLED')),
  agreed_fare_tomans bigint CHECK (agreed_fare_tomans IS NULL OR agreed_fare_tomans > 0),
  assigned_driver_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cargo_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id text NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_fare_tomans bigint NOT NULL CHECK (proposed_fare_tomans > 0),
  ready_to_load_time text,
  driver_notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cargo_id, driver_id)
);

CREATE INDEX IF NOT EXISTS cargos_shipper_id_idx ON cargos (shipper_id);
CREATE INDEX IF NOT EXISTS cargos_assigned_driver_id_idx ON cargos (assigned_driver_id);
CREATE INDEX IF NOT EXISTS cargo_bids_driver_id_idx ON cargo_bids (driver_id);

ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_bids ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON cargos FROM anon, authenticated;
REVOKE ALL ON cargo_bids FROM anon, authenticated;

GRANT SELECT ON cargos TO authenticated;
GRANT INSERT (id, title, origin_city, destination_city, weight_tons, truck_type, shipper_id) ON cargos TO authenticated;
GRANT SELECT ON cargo_bids TO authenticated;
GRANT INSERT (cargo_id, proposed_fare_tomans, ready_to_load_time, driver_notes, driver_id) ON cargo_bids TO authenticated;

DROP POLICY IF EXISTS "cargos_select_visible" ON cargos;
CREATE POLICY "cargos_select_visible" ON cargos FOR SELECT
  TO authenticated
  USING (
    shipper_id = auth.uid()
    OR assigned_driver_id = auth.uid()
    OR status = 'PENDING_DRIVER'
  );

DROP POLICY IF EXISTS "cargos_insert_own" ON cargos;
CREATE POLICY "cargos_insert_own" ON cargos FOR INSERT
  TO authenticated
  WITH CHECK (shipper_id = auth.uid() AND status = 'PENDING_DRIVER' AND assigned_driver_id IS NULL AND agreed_fare_tomans IS NULL);

DROP POLICY IF EXISTS "cargo_bids_select_driver_or_shipper" ON cargo_bids;
CREATE POLICY "cargo_bids_select_driver_or_shipper" ON cargo_bids FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM cargos WHERE cargos.id = cargo_bids.cargo_id AND cargos.shipper_id = auth.uid())
  );

DROP POLICY IF EXISTS "cargo_bids_insert_own" ON cargo_bids;
CREATE POLICY "cargo_bids_insert_own" ON cargo_bids FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND status = 'PENDING'
    AND EXISTS (SELECT 1 FROM cargos WHERE cargos.id = cargo_bids.cargo_id AND cargos.status = 'PENDING_DRIVER')
  );
