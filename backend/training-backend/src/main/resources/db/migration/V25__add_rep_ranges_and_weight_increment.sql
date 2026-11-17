-- A planned rep range: exercises.reps is its bottom and reps_max its top. Null keeps a fixed
-- rep count, as before. For exercises timed in seconds both hold seconds.
ALTER TABLE exercises ADD COLUMN reps_max INTEGER;
ALTER TABLE exercises ADD CONSTRAINT exercises_reps_max_check CHECK (reps_max >= reps);

-- How much weight the suggested next target adds once a session hits the plan; null means
-- the client's default (2.5 kg).
ALTER TABLE library_exercises ADD COLUMN weight_increment NUMERIC(5, 2);
ALTER TABLE library_exercises ADD CONSTRAINT library_exercises_weight_increment_check CHECK (weight_increment > 0);
