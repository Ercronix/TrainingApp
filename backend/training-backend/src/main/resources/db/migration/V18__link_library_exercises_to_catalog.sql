-- ============================================================
-- Migration: Link library entries to the catalog
--
-- A library entry can point at the catalog exercise it was picked from,
-- whose drawing (V19) the client shows. Clearing the catalog never
-- happens, but a link wouldn't block it.
-- ============================================================

ALTER TABLE library_exercises
    ADD COLUMN catalog_exercise_id BIGINT REFERENCES exercise_catalog(id) ON DELETE SET NULL;

-- Entries named exactly like a catalog exercise
UPDATE library_exercises l
SET catalog_exercise_id = c.id
FROM exercise_catalog c
WHERE lower(c.name) = lower(l.name);

-- Short gym names for the big lifts, as the client's catalog search resolves them (ALIASES in
-- frontend/utils/muscles.ts)
UPDATE library_exercises l
SET catalog_exercise_id = c.id
FROM (VALUES
    ('bench', 'Barbell Bench Press - Medium Grip'),
    ('bench press', 'Barbell Bench Press - Medium Grip'),
    ('flat bench', 'Barbell Bench Press - Medium Grip'),
    ('incline bench', 'Barbell Incline Bench Press - Medium Grip'),
    ('incline bench press', 'Barbell Incline Bench Press - Medium Grip'),
    ('squat', 'Barbell Squat'),
    ('back squat', 'Barbell Squat'),
    ('front squat', 'Front Barbell Squat'),
    ('deadlift', 'Barbell Deadlift'),
    ('overhead press', 'Standing Military Press'),
    ('military press', 'Standing Military Press'),
    ('shoulder press', 'Standing Military Press'),
    ('row', 'Bent Over Barbell Row'),
    ('barbell row', 'Bent Over Barbell Row'),
    ('bent over row', 'Bent Over Barbell Row'),
    ('cable row', 'Seated Cable Rows'),
    ('pulldown', 'Wide-Grip Lat Pulldown'),
    ('lat pulldown', 'Wide-Grip Lat Pulldown'),
    ('pull up', 'Pullups'),
    ('pull-up', 'Pullups'),
    ('pullup', 'Pullups'),
    ('pull ups', 'Pullups'),
    ('push up', 'Pushups'),
    ('push-up', 'Pushups'),
    ('pushup', 'Pushups'),
    ('push ups', 'Pushups'),
    ('dip', 'Dips - Triceps Version'),
    ('dips', 'Dips - Triceps Version'),
    ('hip thrust', 'Barbell Hip Thrust'),
    ('curl', 'Barbell Curl'),
    ('bicep curl', 'Barbell Curl'),
    ('biceps curl', 'Barbell Curl'),
    ('pushdown', 'Triceps Pushdown'),
    ('tricep pushdown', 'Triceps Pushdown'),
    ('skull crusher', 'EZ-Bar Skullcrusher'),
    ('skull crushers', 'EZ-Bar Skullcrusher'),
    ('fly', 'Dumbbell Flyes'),
    ('chest fly', 'Dumbbell Flyes'),
    ('shrug', 'Barbell Shrug'),
    ('shrugs', 'Barbell Shrug'),
    ('lunge', 'Dumbbell Lunges'),
    ('lunges', 'Dumbbell Lunges'),
    ('bulgarian split squat', 'Split Squat with Dumbbells'),
    ('split squat', 'Split Squat with Dumbbells'),
    ('leg curl', 'Lying Leg Curls'),
    ('calf raise', 'Standing Calf Raises'),
    ('calf raises', 'Standing Calf Raises')
) AS alias(query, catalog_name)
JOIN exercise_catalog c ON c.name = alias.catalog_name
WHERE l.catalog_exercise_id IS NULL AND lower(trim(l.name)) = alias.query;
