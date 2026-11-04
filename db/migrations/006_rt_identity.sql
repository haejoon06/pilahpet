ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS rt_number text,
  ADD COLUMN IF NOT EXISTS rw_number text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS chairperson_name text;
