CREATE TABLE IF NOT EXISTS member_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  application_code text NOT NULL UNIQUE,
  name text NOT NULL,
  area text NOT NULL,
  phone text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('individual','group')),
  benefit_mode text NOT NULL CHECK (benefit_mode IN ('individual_balance','group_cash')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes text,
  member_id uuid REFERENCES members(id),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_credentials (
  member_id uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_location_status
  ON member_applications(location_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION cancel_pet_deposit(
  p_location_id uuid, p_deposit_id uuid, p_reason text, p_actor text
) RETURNS uuid AS $$
DECLARE
  v_deposit deposits%ROWTYPE;
  v_material_id uuid;
  v_stock numeric(12,3);
BEGIN
  SELECT * INTO v_deposit FROM deposits
    WHERE id = p_deposit_id AND location_id = p_location_id
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Setoran tidak ditemukan'; END IF;
  IF v_deposit.status <> 'confirmed' THEN RAISE EXCEPTION 'Setoran sudah dibatalkan'; END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 5 THEN RAISE EXCEPTION 'Alasan pembatalan wajib diisi'; END IF;

  SELECT id INTO v_material_id FROM material_categories WHERE code = 'PET-1' AND active = true;
  SELECT COALESCE(sum(quantity_kg),0) INTO v_stock FROM stock_movements
    WHERE location_id = p_location_id AND material_id = v_material_id;
  IF v_stock < v_deposit.net_weight_kg THEN
    RAISE EXCEPTION 'Stok tidak cukup untuk membatalkan setoran yang sudah ikut terjual';
  END IF;

  UPDATE deposits SET status = 'cancelled', rejection_reason = trim(p_reason), cancelled_at = now()
    WHERE id = p_deposit_id;
  INSERT INTO stock_movements(location_id, material_id, movement_type, quantity_kg, reference_type, reference_id, notes, created_by)
    VALUES(p_location_id, v_material_id, 'reversal', -v_deposit.net_weight_kg, 'deposit', p_deposit_id, trim(p_reason), p_actor);
  INSERT INTO benefit_ledger(location_id, member_id, entry_type, amount, reference_type, reference_id, created_by)
    VALUES(p_location_id, v_deposit.member_id, 'reversal', -v_deposit.total_value, 'deposit', p_deposit_id, p_actor);
  INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, before_data, after_data)
    VALUES(p_location_id, p_actor, 'deposit.cancel', 'deposit', p_deposit_id,
      jsonb_build_object('status','confirmed','net_weight_kg',v_deposit.net_weight_kg,'total_value',v_deposit.total_value),
      jsonb_build_object('status','cancelled','reason',trim(p_reason)));
  RETURN p_deposit_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_benefit_payout(
  p_location_id uuid, p_member_id uuid, p_amount numeric, p_notes text, p_actor text
) RETURNS uuid AS $$
DECLARE
  v_balance numeric(14,2);
  v_cash numeric(14,2);
  v_entry_id uuid;
  v_mode text;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Nominal pencairan harus lebih besar dari nol'; END IF;
  SELECT benefit_mode INTO v_mode FROM members
    WHERE id = p_member_id AND location_id = p_location_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Anggota tidak ditemukan'; END IF;
  IF v_mode <> 'individual_balance' THEN RAISE EXCEPTION 'Pencairan hanya tersedia untuk saldo individu'; END IF;

  SELECT COALESCE(sum(amount),0) INTO v_balance FROM benefit_ledger
    WHERE location_id = p_location_id AND member_id = p_member_id;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Nominal melebihi saldo anggota'; END IF;
  SELECT COALESCE(sum(CASE WHEN entry_type = 'income' THEN amount ELSE -amount END),0) INTO v_cash
    FROM cash_entries WHERE location_id = p_location_id;
  IF p_amount > v_cash THEN RAISE EXCEPTION 'Kas belum cukup untuk pencairan'; END IF;

  INSERT INTO benefit_ledger(location_id, member_id, entry_type, amount, reference_type, reference_id, created_by)
    VALUES(p_location_id, p_member_id, 'debit', -p_amount, 'payout', gen_random_uuid(), p_actor)
    RETURNING id INTO v_entry_id;
  UPDATE benefit_ledger SET reference_id = v_entry_id WHERE id = v_entry_id;
  INSERT INTO cash_entries(location_id, entry_type, category, amount, reference_type, reference_id, notes, created_by)
    VALUES(p_location_id, 'expense', 'benefit_payout', p_amount, 'benefit_ledger', v_entry_id, nullif(trim(p_notes),''), p_actor);
  INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
    VALUES(p_location_id, p_actor, 'benefit.payout', 'benefit_ledger', v_entry_id,
      jsonb_build_object('member_id',p_member_id,'amount',p_amount,'notes',nullif(trim(p_notes),'')));
  RETURN v_entry_id;
END; $$ LANGUAGE plpgsql;
