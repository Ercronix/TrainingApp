-- What an exercise is done with (barbell, dumbbell, cable, ...), in the catalog's vocabulary.
-- The client shows the plate calculator for barbell exercises only.
ALTER TABLE library_exercises ADD COLUMN equipment VARCHAR(30);

-- Entries named exactly like a catalog exercise take its equipment
UPDATE library_exercises l
SET equipment = c.equipment
FROM exercise_catalog c
WHERE lower(c.name) = lower(l.name) AND c.equipment IS NOT NULL AND c.equipment <> '';

-- Anything else with "barbell" in its name is one
UPDATE library_exercises
SET equipment = 'barbell'
WHERE equipment IS NULL AND name ILIKE '%barbell%';
