ALTER TABLE locations ADD COLUMN IF NOT EXISTS province text;

WITH ranked_identity AS (
  SELECT DISTINCT ON (location_id) location_id,province
  FROM households
  GROUP BY location_id,province
  ORDER BY location_id,count(*) DESC,province
)
UPDATE locations AS location SET province=identity.province
FROM ranked_identity AS identity WHERE identity.location_id=location.id;
