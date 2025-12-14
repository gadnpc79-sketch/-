-- 1. Performance Optimization Indexes
-- Note: 'location' is the column name used in the app, not 'address'.
CREATE INDEX idx_complaints_category ON complaints (category);
CREATE INDEX idx_complaints_location ON complaints (location);

-- 2. Statistics RPC Function
-- Note: Categories are 'roadkill', 'trash', 'fire' (lowercase) in the app.
CREATE OR REPLACE FUNCTION get_complaint_statistics()
RETURNS TABLE(
  total bigint,
  roadkill_count bigint,
  trash_count bigint,
  fire_count bigint
)
LANGUAGE sql
AS $$
  SELECT
    (SELECT COUNT(*) FROM complaints) AS total,
    (SELECT COUNT(*) FROM complaints WHERE category = 'roadkill') AS roadkill_count,
    (SELECT COUNT(*) FROM complaints WHERE category = 'trash') AS trash_count,
    (SELECT COUNT(*) FROM complaints WHERE category = 'fire') AS fire_count;
$$;
