UPDATE households SET province='Jawa Barat'
WHERE lower(trim(province)) IN ('jawaba barat','jawa barat');

UPDATE locations SET province='Jawa Barat'
WHERE lower(trim(province)) IN ('jawaba barat','jawa barat');
