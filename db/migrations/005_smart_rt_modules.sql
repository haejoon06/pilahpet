ALTER TABLE members
  ADD COLUMN IF NOT EXISTS resident_id uuid UNIQUE REFERENCES residents(id);

CREATE TABLE IF NOT EXISTS rt_cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  entry_type text NOT NULL CHECK (entry_type IN ('income','expense')),
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bottle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  claim_token text NOT NULL UNIQUE,
  device_code text NOT NULL,
  bottle_count integer NOT NULL CHECK (bottle_count > 0),
  weight_kg numeric(12,3) NOT NULL CHECK (weight_kg > 0),
  voucher_amount numeric(14,2) NOT NULL CHECK (voucher_amount >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','claimed','expired','cancelled')),
  claimed_by uuid REFERENCES members(id),
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voucher_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  member_id uuid NOT NULL REFERENCES members(id),
  bottle_event_id uuid NOT NULL UNIQUE REFERENCES bottle_events(id),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','cancelled')),
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS letter_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  member_id uuid NOT NULL REFERENCES members(id),
  letter_type text NOT NULL CHECK (letter_type IN ('introduction','domicile','business','indigent')),
  purpose text NOT NULL,
  extra_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  letter_number text,
  notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rt_cash_location_date ON rt_cash_entries(location_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_events_status ON bottle_events(location_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_member ON voucher_ledger(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_location_status ON letter_requests(location_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_member ON letter_requests(member_id, created_at DESC);

CREATE OR REPLACE FUNCTION claim_bottle_voucher(p_token text,p_member_id uuid)
RETURNS numeric AS $$
DECLARE v_event bottle_events%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM bottle_events WHERE claim_token=p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QR setoran tidak ditemukan'; END IF;
  IF v_event.status<>'available' THEN RAISE EXCEPTION 'QR sudah digunakan atau tidak aktif'; END IF;
  IF v_event.expires_at<now() THEN
    UPDATE bottle_events SET status='expired' WHERE id=v_event.id;
    RAISE EXCEPTION 'QR sudah kedaluwarsa';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM members WHERE id=p_member_id AND active=true) THEN RAISE EXCEPTION 'Akun warga tidak aktif'; END IF;
  UPDATE bottle_events SET status='claimed',claimed_by=p_member_id,claimed_at=now() WHERE id=v_event.id;
  INSERT INTO voucher_ledger(location_id,member_id,bottle_event_id,amount)
    VALUES(v_event.location_id,p_member_id,v_event.id,v_event.voucher_amount);
  INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(v_event.location_id,'member','voucher.claim','bottle_event',v_event.id,
      jsonb_build_object('member_id',p_member_id,'amount',v_event.voucher_amount));
  RETURN v_event.voucher_amount;
END; $$ LANGUAGE plpgsql;
