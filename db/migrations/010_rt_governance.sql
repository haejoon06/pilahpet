ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS subdistrict text,
  ADD COLUMN IF NOT EXISTS regency text,
  ADD COLUMN IF NOT EXISTS postal_code text;

CREATE TABLE IF NOT EXISTS rt_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('chairperson','secretary','treasurer','admin','waste_manager')),
  full_name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  phone text,
  notes text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_rt_officials_location_period
  ON rt_officials(location_id, position, start_date DESC, end_date);

WITH ranked_identity AS (
  SELECT DISTINCT ON (location_id)
    location_id, rt, rw, village, subdistrict, regency, postal_code
  FROM households
  GROUP BY location_id, rt, rw, village, subdistrict, regency, postal_code
  ORDER BY location_id, count(*) DESC, rt, rw
)
UPDATE locations AS location
SET
  name = CASE
    WHEN location.name = 'Lokasi Pilot' THEN 'RT ' || identity.rt || '/RW ' || identity.rw || ' ' || identity.village
    ELSE location.name
  END,
  rt_number = identity.rt,
  rw_number = identity.rw,
  village = identity.village,
  subdistrict = identity.subdistrict,
  regency = identity.regency,
  postal_code = identity.postal_code,
  address = COALESCE(NULLIF(location.address, ''),
    'Sekretariat RT ' || identity.rt || '/RW ' || identity.rw || ', ' || identity.village || ', ' ||
    identity.subdistrict || ', ' || identity.regency || COALESCE(' ' || identity.postal_code, ''))
FROM ranked_identity AS identity
WHERE identity.location_id = location.id;
