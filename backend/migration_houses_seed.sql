INSERT INTO houses (name, color, crest) VALUES 
('Barrel', '#f44336', '/assets/houses/barrel.png'),
('Cadillac', '#2196f3', '/assets/houses/Cadilac.png'),
('Chair', '#ffd700', '/assets/houses/chair.png'),
('Joseph', '#ff9800', '/assets/houses/joseph.png'),
('Reformer', '#4caf50', '/assets/houses/reformer.png')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color, crest = EXCLUDED.crest; -- Assuming name is unique? Schema doesn't say unique constraint on name, but it should be or migration V12 would duplicate. V12 added index on rules, not houses.
-- I'll check schema again. Schema line 5: name TEXT NOT NULL. No unique.
-- So I should check existence first or add unique constraint.
-- Safe seed:
INSERT INTO houses (name, color, crest)
SELECT 'Barrel', '#f44336', '/assets/houses/barrel.png'
WHERE NOT EXISTS (SELECT 1 FROM houses WHERE name = 'Barrel');

INSERT INTO houses (name, color, crest)
SELECT 'Cadillac', '#2196f3', '/assets/houses/Cadilac.png'
WHERE NOT EXISTS (SELECT 1 FROM houses WHERE name = 'Cadillac');

INSERT INTO houses (name, color, crest)
SELECT 'Chair', '#ffd700', '/assets/houses/chair.png'
WHERE NOT EXISTS (SELECT 1 FROM houses WHERE name = 'Chair');

INSERT INTO houses (name, color, crest)
SELECT 'Joseph', '#ff9800', '/assets/houses/joseph.png'
WHERE NOT EXISTS (SELECT 1 FROM houses WHERE name = 'Joseph');

INSERT INTO houses (name, color, crest)
SELECT 'Reformer', '#4caf50', '/assets/houses/reformer.png'
WHERE NOT EXISTS (SELECT 1 FROM houses WHERE name = 'Reformer');
