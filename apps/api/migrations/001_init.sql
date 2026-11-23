-- 001_init.sql — اسکیمای اولیه TLD Logistics

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('shipper', 'driver', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cargos (
  id               BIGSERIAL PRIMARY KEY,
  owner_id         BIGINT NOT NULL REFERENCES users(id),
  title            TEXT NOT NULL,
  origin_city      TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  weight_ton       NUMERIC(10,2) NOT NULL,
  price_irr        BIGINT NOT NULL CHECK (price_irr > 0),
  status           TEXT NOT NULL DEFAULT 'listed'
                   CHECK (status IN ('listed','assigned','funded','in_transit','delivered','released','cancelled')),
  driver_id        BIGINT REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cargos_status ON cargos (status);
CREATE INDEX IF NOT EXISTS idx_cargos_owner ON cargos (owner_id);

CREATE TABLE IF NOT EXISTS bids (
  id         BIGSERIAL PRIMARY KEY,
  cargo_id   BIGINT NOT NULL REFERENCES cargos(id),
  driver_id  BIGINT NOT NULL REFERENCES users(id),
  amount_irr BIGINT NOT NULL CHECK (amount_irr > 0),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cargo_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_bids_cargo ON bids (cargo_id);

CREATE TABLE IF NOT EXISTS waybills (
  id        BIGSERIAL PRIMARY KEY,
  cargo_id  BIGINT UNIQUE NOT NULL REFERENCES cargos(id),
  serial    TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- دفتر امانی: hold واریز، release_to_driver آزادسازی، commission کارمزد سامانه، vat مالیات آن
CREATE TABLE IF NOT EXISTS escrow_entries (
  id         BIGSERIAL PRIMARY KEY,
  cargo_id   BIGINT NOT NULL REFERENCES cargos(id),
  kind       TEXT NOT NULL CHECK (kind IN ('hold','release_to_driver','commission','vat')),
  amount_irr BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_cargo ON escrow_entries (cargo_id);

-- تله‌متری ماژول IoT (TLD-Box)
CREATE TABLE IF NOT EXISTS telemetry (
  id             BIGSERIAL PRIMARY KEY,
  cargo_id       BIGINT NOT NULL REFERENCES cargos(id),
  fuel_level_pct NUMERIC(5,2),
  temp_zone1_c   NUMERIC(5,2),
  temp_zone2_c   NUMERIC(5,2),
  temp_zone3_c   NUMERIC(5,2),
  shock_g        NUMERIC(6,2),
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_cargo ON telemetry (cargo_id, recorded_at DESC);
