ALTER TABLE letter_requests
  DROP CONSTRAINT IF EXISTS letter_requests_letter_type_check;

ALTER TABLE letter_requests
  ADD CONSTRAINT letter_requests_letter_type_check CHECK (letter_type IN (
    'introduction','domicile','business','indigent','police_record','marriage',
    'crowd_permit','birth','death','loss','unmarried'
  ));

CREATE OR REPLACE FUNCTION approve_letter_request(
  p_request_id uuid,
  p_location_id uuid,
  p_reviewer text,
  p_notes text DEFAULT NULL,
  p_custom_number text DEFAULT NULL
)
RETURNS TABLE(id uuid, status text, letter_number text, sequence_number integer, letter_year integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_request letter_requests%ROWTYPE;
  v_location locations%ROWTYPE;
  v_year integer;
  v_month integer;
  v_sequence integer;
  v_type_code text;
  v_month_roman text;
  v_number text;
BEGIN
  v_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta')::integer;
  v_month := EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Jakarta')::integer;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_location_id::text || ':' || v_year::text, 0));

  SELECT * INTO v_request
  FROM letter_requests
  WHERE letter_requests.id = p_request_id
    AND location_id = p_location_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'LETTER_ALREADY_PROCESSED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_location FROM locations WHERE locations.id = p_location_id;

  SELECT COALESCE(MAX(lr.sequence_number), 0) + 1 INTO v_sequence
  FROM letter_requests lr
  WHERE lr.location_id = p_location_id AND lr.letter_year = v_year;

  v_type_code := CASE v_request.letter_type
    WHEN 'introduction' THEN 'SP'
    WHEN 'domicile' THEN 'SKD'
    WHEN 'business' THEN 'SKU'
    WHEN 'indigent' THEN 'SKTM'
    WHEN 'police_record' THEN 'PSKCK'
    WHEN 'marriage' THEN 'SPN'
    WHEN 'crowd_permit' THEN 'PIK'
    WHEN 'birth' THEN 'SKL'
    WHEN 'death' THEN 'SKM'
    WHEN 'loss' THEN 'PKH'
    WHEN 'unmarried' THEN 'SKBM'
    ELSE 'SRT'
  END;

  v_month_roman := (ARRAY['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[v_month];
  v_number := NULLIF(BTRIM(p_custom_number), '');

  IF v_number IS NULL THEN
    v_number := LPAD(v_sequence::text, 3, '0') || '/' || v_type_code ||
      '/RT-' || COALESCE(NULLIF(v_location.rt_number, ''), '-') ||
      '/RW-' || COALESCE(NULLIF(v_location.rw_number, ''), '-') ||
      '/' || v_month_roman || '/' || v_year::text;
  END IF;

  RETURN QUERY
  UPDATE letter_requests lr
  SET status = 'approved',
      letter_number = v_number,
      sequence_number = v_sequence,
      letter_year = v_year,
      notes = NULLIF(BTRIM(p_notes), ''),
      reviewed_by = p_reviewer,
      reviewed_at = now(),
      updated_at = now()
  WHERE lr.id = p_request_id
  RETURNING lr.id, lr.status, lr.letter_number, lr.sequence_number, lr.letter_year;
END;
$$;
