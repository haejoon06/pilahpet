ALTER TABLE letter_requests
  ADD COLUMN IF NOT EXISTS resident_id uuid REFERENCES residents(id);

UPDATE letter_requests lr
SET resident_id = m.resident_id
FROM members m
WHERE lr.member_id = m.id
  AND lr.resident_id IS NULL
  AND m.resident_id IS NOT NULL;

ALTER TABLE letter_requests ALTER COLUMN member_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'letter_requests_applicant_check'
  ) THEN
    ALTER TABLE letter_requests
      ADD CONSTRAINT letter_requests_applicant_check
      CHECK (member_id IS NOT NULL OR resident_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_letters_resident
  ON letter_requests(resident_id, created_at DESC);

CREATE OR REPLACE FUNCTION create_letter_by_staff(
  p_location_id uuid,
  p_resident_id uuid,
  p_letter_type text,
  p_purpose text,
  p_extra_data jsonb,
  p_reviewer text,
  p_notes text DEFAULT NULL,
  p_custom_number text DEFAULT NULL
)
RETURNS TABLE(id uuid, status text, letter_number text, sequence_number integer, letter_year integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM residents
    WHERE residents.id = p_resident_id
      AND residents.location_id = p_location_id
      AND residents.active = true
  ) THEN
    RAISE EXCEPTION 'RESIDENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO letter_requests(
    location_id, resident_id, letter_type, purpose, extra_data, status
  ) VALUES(
    p_location_id, p_resident_id, p_letter_type, p_purpose,
    COALESCE(p_extra_data, '{}'::jsonb), 'pending'
  ) RETURNING letter_requests.id INTO v_request_id;

  RETURN QUERY
  SELECT * FROM approve_letter_request(
    v_request_id, p_location_id, p_reviewer, p_notes, p_custom_number
  );
END;
$$;
