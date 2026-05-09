-- Migration V13: Houses Colors and Login Logic Update

-- 1. Ensure Houses are Correctly Configured with New Colors and Images
-- We use UPDATE instead of INSERT to preserve IDs if they exist
-- Colors: barrel (red), cadillac (blue), chair (yellow), joseph (orange), reformer (green)

UPDATE houses SET color = '#f44336', crest = '/assets/houses/barrel.png' WHERE name ILIKE '%Barrel%';
UPDATE houses SET color = '#2196f3', crest = '/assets/houses/Cadilac.png' WHERE name ILIKE '%Cadillac%' OR name ILIKE '%Cadilac%';
UPDATE houses SET color = '#ffd700', crest = '/assets/houses/chair.png' WHERE name ILIKE '%Chair%';
UPDATE houses SET color = '#ff9800', crest = '/assets/houses/joseph.png' WHERE name ILIKE '%Joseph%';
UPDATE houses SET color = '#4caf50', crest = '/assets/houses/reformer.png' WHERE name ILIKE '%Reformer%';

-- 2. Add Unique Constraint on Phone for Login Logic (Login = Name, Pass = Phone)
-- We might need to clean duplicate phones first if any?
-- For now, we trust application logic to handle uniqueness or the index creation might fail if duplicates exist.
-- Ideally we enforce unique phone. 
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone); -- Risky if duplicates exist. Skipping strict constraint for now, will handle in app logic.

-- 3. Ensure 'active' column is used for soft delete (already in previous schemas but reinforcing default)
ALTER TABLE patients ALTER COLUMN active SET DEFAULT 1;
