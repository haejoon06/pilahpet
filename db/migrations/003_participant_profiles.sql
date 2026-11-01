ALTER TABLE member_applications
  ADD COLUMN IF NOT EXISTS group_name text,
  ADD COLUMN IF NOT EXISTS participant_category text NOT NULL DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS rt text,
  ADD COLUMN IF NOT EXISTS rw text,
  ADD COLUMN IF NOT EXISTS village text;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS group_name text,
  ADD COLUMN IF NOT EXISTS participant_category text NOT NULL DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS rt text,
  ADD COLUMN IF NOT EXISTS rw text,
  ADD COLUMN IF NOT EXISTS village text;

ALTER TABLE member_applications
  ADD CONSTRAINT member_applications_participant_category_check
  CHECK (participant_category IN ('elementary', 'junior_high', 'senior_high', 'adult'));

ALTER TABLE members
  ADD CONSTRAINT members_participant_category_check
  CHECK (participant_category IN ('elementary', 'junior_high', 'senior_high', 'adult'));

UPDATE member_applications
SET village = area
WHERE village IS NULL;

UPDATE members
SET village = area
WHERE village IS NULL;
