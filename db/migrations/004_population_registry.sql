CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  family_card_number_encrypted text NOT NULL,
  family_card_number_hash text NOT NULL,
  family_card_number_last4 text NOT NULL,
  head_name text NOT NULL,
  address text NOT NULL,
  rt text NOT NULL,
  rw text NOT NULL,
  postal_code text,
  village text NOT NULL,
  subdistrict text NOT NULL,
  regency text NOT NULL,
  province text NOT NULL,
  issued_at date,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, family_card_number_hash),
  CHECK (rt ~ '^[0-9]{1,3}$'),
  CHECK (rw ~ '^[0-9]{1,3}$')
);

CREATE TABLE IF NOT EXISTS residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  nik_encrypted text NOT NULL,
  nik_hash text NOT NULL,
  nik_last4 text NOT NULL,
  full_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  birth_place text NOT NULL,
  birth_date date NOT NULL,
  religion text NOT NULL,
  education text NOT NULL,
  occupation text NOT NULL,
  blood_type text NOT NULL DEFAULT 'unknown',
  marital_status text NOT NULL,
  marriage_date date,
  family_relationship text NOT NULL,
  citizenship text NOT NULL DEFAULT 'WNI',
  father_name text,
  mother_name text,
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, nik_hash)
);

CREATE INDEX IF NOT EXISTS idx_households_location_rt_rw
  ON households(location_id, rt, rw, head_name);
CREATE INDEX IF NOT EXISTS idx_residents_household_name
  ON residents(household_id, full_name) WHERE active = true;
