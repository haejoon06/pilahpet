UPDATE locations
SET name = 'RT 010/RW 004 Puseurjaya',
    address = 'Rumah Nomor 7, Dusun Kaum Jaya, Desa Puseurjaya, Kecamatan Telukjambe Timur, Kabupaten Karawang 41361',
    rt_number = '010',
    rw_number = '004',
    village = 'Puseurjaya',
    subdistrict = 'Telukjambe Timur',
    regency = 'Karawang',
    province = 'Jawa Barat',
    postal_code = '41361';

UPDATE households
SET rt = '010',
    rw = '004',
    village = 'Puseurjaya',
    subdistrict = 'Telukjambe Timur',
    regency = 'Karawang',
    province = 'Jawa Barat',
    postal_code = '41361';

CREATE TABLE IF NOT EXISTS death_fund_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  entry_type text NOT NULL CHECK (entry_type IN ('contribution','benefit')),
  resident_id uuid REFERENCES residents(id),
  contribution_month date,
  deceased_name text,
  recipient_name text,
  description text,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (entry_type = 'contribution' AND resident_id IS NOT NULL AND contribution_month IS NOT NULL)
    OR
    (entry_type = 'benefit' AND deceased_name IS NOT NULL AND recipient_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_death_fund_location_date
  ON death_fund_entries(location_id, transaction_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_death_fund_resident_month
  ON death_fund_entries(resident_id, contribution_month DESC)
  WHERE entry_type = 'contribution';
