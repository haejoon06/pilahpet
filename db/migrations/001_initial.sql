CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, address text,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  member_code text NOT NULL UNIQUE, name text NOT NULL, area text NOT NULL, phone text,
  account_type text NOT NULL CHECK (account_type IN ('individual','group')),
  benefit_mode text NOT NULL CHECK (benefit_mode IN ('individual_balance','group_cash')),
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL,
  resin_code text NOT NULL, unit text NOT NULL DEFAULT 'kg', active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  material_id uuid NOT NULL REFERENCES material_categories(id), price_per_kg numeric(14,2) NOT NULL CHECK (price_per_kg >= 0),
  effective_at timestamptz NOT NULL DEFAULT now(), created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  member_id uuid NOT NULL REFERENCES members(id), client_transaction_id text NOT NULL UNIQUE,
  gross_weight_kg numeric(12,3) NOT NULL, tare_weight_kg numeric(12,3) NOT NULL,
  net_weight_kg numeric(12,3) NOT NULL CHECK (net_weight_kg > 0), price_snapshot numeric(14,2) NOT NULL,
  total_value numeric(14,2) NOT NULL, status text NOT NULL CHECK (status IN ('confirmed','cancelled')),
  rejection_reason text, created_by text NOT NULL, confirmed_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  material_id uuid NOT NULL REFERENCES material_categories(id),
  movement_type text NOT NULL CHECK (movement_type IN ('deposit','sale','correction','reversal')),
  quantity_kg numeric(12,3) NOT NULL, reference_type text NOT NULL, reference_id uuid NOT NULL,
  notes text, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  name text NOT NULL, phone text, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(location_id, name)
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  buyer_id uuid NOT NULL REFERENCES buyers(id), material_id uuid NOT NULL REFERENCES material_categories(id),
  weight_kg numeric(12,3) NOT NULL CHECK (weight_kg > 0), price_per_kg numeric(14,2) NOT NULL CHECK (price_per_kg >= 0),
  gross_value numeric(14,2) NOT NULL, transport_cost numeric(14,2) NOT NULL DEFAULT 0,
  net_value numeric(14,2) NOT NULL, created_by text NOT NULL, sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS benefit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  member_id uuid NOT NULL REFERENCES members(id), entry_type text NOT NULL CHECK (entry_type IN ('credit','debit','reversal')),
  amount numeric(14,2) NOT NULL, reference_type text NOT NULL, reference_id uuid NOT NULL,
  created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  entry_type text NOT NULL CHECK (entry_type IN ('income','expense','reversal')), category text NOT NULL,
  amount numeric(14,2) NOT NULL, reference_type text NOT NULL, reference_id uuid NOT NULL, notes text,
  created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  inspection_type text NOT NULL, finding text, action_taken text, critical boolean NOT NULL DEFAULT false,
  inspected_by text NOT NULL, inspected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid REFERENCES locations(id), actor text NOT NULL,
  action text NOT NULL, entity_type text NOT NULL, entity_id uuid, before_data jsonb, after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES locations(id),
  name text NOT NULL, device_type text NOT NULL, enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, device_id uuid NOT NULL REFERENCES devices(id),
  metric text NOT NULL, value numeric NOT NULL, unit text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposits_location_date ON deposits(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_location_date ON stock_movements(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_member_date ON benefit_ledger(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_location_date ON cash_entries(location_id, created_at DESC);

INSERT INTO material_categories(code, name, resin_code) VALUES ('PET-1', 'Botol minuman PET', '1')
ON CONFLICT (code) DO UPDATE SET active = true;
INSERT INTO locations(name, address) SELECT 'Lokasi Pilot', NULL WHERE NOT EXISTS (SELECT 1 FROM locations);

CREATE OR REPLACE FUNCTION confirm_pet_deposit(
  p_location_id uuid, p_member_id uuid, p_gross_kg numeric, p_tare_kg numeric,
  p_client_transaction_id text, p_actor text
) RETURNS uuid AS $$
DECLARE v_material_id uuid; v_price numeric(14,2); v_net numeric(12,3); v_total numeric(14,2); v_deposit_id uuid;
BEGIN
  v_net := round(p_gross_kg - p_tare_kg, 3);
  IF v_net <= 0 THEN RAISE EXCEPTION 'Berat bersih harus lebih besar dari nol'; END IF;
  SELECT id INTO v_material_id FROM material_categories WHERE code = 'PET-1' AND active = true;
  SELECT price_per_kg INTO v_price FROM price_history WHERE location_id = p_location_id
    AND material_id = v_material_id AND effective_at <= now() ORDER BY effective_at DESC LIMIT 1;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Harga PET aktif belum ditetapkan'; END IF;
  v_total := round(v_net * v_price, 0);
  INSERT INTO deposits(location_id, member_id, client_transaction_id, gross_weight_kg, tare_weight_kg,
    net_weight_kg, price_snapshot, total_value, status, created_by)
  VALUES(p_location_id, p_member_id, p_client_transaction_id, p_gross_kg, p_tare_kg,
    v_net, v_price, v_total, 'confirmed', p_actor) RETURNING id INTO v_deposit_id;
  INSERT INTO stock_movements(location_id, material_id, movement_type, quantity_kg, reference_type, reference_id, created_by)
  VALUES(p_location_id, v_material_id, 'deposit', v_net, 'deposit', v_deposit_id, p_actor);
  INSERT INTO benefit_ledger(location_id, member_id, entry_type, amount, reference_type, reference_id, created_by)
  VALUES(p_location_id, p_member_id, 'credit', v_total, 'deposit', v_deposit_id, p_actor);
  INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
  VALUES(p_location_id, p_actor, 'deposit.confirm', 'deposit', v_deposit_id,
    jsonb_build_object('net_weight_kg', v_net, 'price_snapshot', v_price, 'total_value', v_total));
  RETURN v_deposit_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_pet_sale(
  p_location_id uuid, p_buyer_name text, p_weight_kg numeric, p_price_per_kg numeric,
  p_transport_cost numeric, p_actor text
) RETURNS uuid AS $$
DECLARE v_material_id uuid; v_buyer_id uuid; v_stock numeric(12,3); v_sale_id uuid; v_gross numeric(14,2); v_net numeric(14,2);
BEGIN
  IF p_weight_kg <= 0 THEN RAISE EXCEPTION 'Berat penjualan harus lebih besar dari nol'; END IF;
  SELECT id INTO v_material_id FROM material_categories WHERE code = 'PET-1' AND active = true;
  SELECT COALESCE(sum(quantity_kg),0) INTO v_stock FROM stock_movements WHERE location_id = p_location_id AND material_id = v_material_id;
  IF p_weight_kg > v_stock THEN RAISE EXCEPTION 'Berat penjualan melebihi stok tersedia'; END IF;
  INSERT INTO buyers(location_id, name) VALUES(p_location_id, p_buyer_name)
    ON CONFLICT(location_id, name) DO UPDATE SET active = true RETURNING id INTO v_buyer_id;
  v_gross := round(p_weight_kg * p_price_per_kg, 0); v_net := v_gross - COALESCE(p_transport_cost,0);
  INSERT INTO sales(location_id, buyer_id, material_id, weight_kg, price_per_kg, gross_value, transport_cost, net_value, created_by)
  VALUES(p_location_id, v_buyer_id, v_material_id, p_weight_kg, p_price_per_kg, v_gross,
    COALESCE(p_transport_cost,0), v_net, p_actor) RETURNING id INTO v_sale_id;
  INSERT INTO stock_movements(location_id, material_id, movement_type, quantity_kg, reference_type, reference_id, created_by)
  VALUES(p_location_id, v_material_id, 'sale', -p_weight_kg, 'sale', v_sale_id, p_actor);
  INSERT INTO cash_entries(location_id, entry_type, category, amount, reference_type, reference_id, notes, created_by)
  VALUES(p_location_id, 'income', 'sale', v_gross, 'sale', v_sale_id, p_buyer_name, p_actor);
  IF COALESCE(p_transport_cost,0) > 0 THEN
    INSERT INTO cash_entries(location_id, entry_type, category, amount, reference_type, reference_id, notes, created_by)
    VALUES(p_location_id, 'expense', 'transport', p_transport_cost, 'sale', v_sale_id, p_buyer_name, p_actor);
  END IF;
  INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
  VALUES(p_location_id, p_actor, 'sale.create', 'sale', v_sale_id,
    jsonb_build_object('weight_kg', p_weight_kg, 'gross_value', v_gross, 'net_value', v_net));
  RETURN v_sale_id;
END; $$ LANGUAGE plpgsql;

