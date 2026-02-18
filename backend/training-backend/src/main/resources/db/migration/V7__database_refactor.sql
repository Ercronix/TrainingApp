-- ============================================================
-- Migration: Refactor workouts → workouts + exercises
--
-- What this does:
--   1. Create new `exercises` table (moves sets/reps/weight/video
--      fields out of workouts)
--   2. Migrate existing workout data into exercises (one exercise
--      per workout, preserving all data)
--   3. Strip exercise-specific columns from workouts
--   4. Migrate exercise_logs to reference exercises instead of workouts
--   5. Clean up old indexes/constraints
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Step 1: Create the exercises table
-- ────────────────────────────────────────────────────────────
CREATE TABLE exercises (
    id                BIGSERIAL PRIMARY KEY,
    workout_id        BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    video_url         VARCHAR(500),
    video_id          VARCHAR(50),
    sets              INT,
    reps              INT,
    planned_weight    DECIMAL(5,2),
    last_used_weight  DECIMAL(5,2),
    last_trained_at   TIMESTAMP,
    order_index       INT DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX idx_exercises_order ON exercises(workout_id, order_index);
CREATE INDEX idx_exercises_video_id ON exercises(video_id);
CREATE INDEX idx_exercises_last_trained ON exercises(last_trained_at);

COMMENT ON TABLE exercises IS 'Individual exercises within a workout day';
COMMENT ON COLUMN exercises.planned_weight IS 'Target weight for this exercise';
COMMENT ON COLUMN exercises.last_used_weight IS 'Last actually used weight';
COMMENT ON COLUMN exercises.last_trained_at IS 'Timestamp of last training session';

-- ────────────────────────────────────────────────────────────
-- Step 2: Migrate existing workout data into exercises
-- Each existing workout row becomes one exercise inside itself,
-- preserving name, description, video, sets, reps, weight data.
-- ────────────────────────────────────────────────────────────
INSERT INTO exercises (
    workout_id,
    name,
    description,
    video_url,
    video_id,
    sets,
    reps,
    planned_weight,
    last_used_weight,
    last_trained_at,
    order_index,
    created_at,
    updated_at
)
SELECT
    id,             -- workout_id = the workout itself
    name,
    description,
    video_url,
    video_id,
    sets,
    reps,
    planned_weight,
    last_used_weight,
    last_trained_at,
    0,              -- order_index: first (and only) exercise
    created_at,
    updated_at
FROM workouts;

-- ────────────────────────────────────────────────────────────
-- Step 3: Migrate exercise_logs — swap workout_id FK for exercise_id
-- We add the new column first, populate it from the migrated
-- exercises (matched by workout_id), then drop the old column.
-- ────────────────────────────────────────────────────────────
ALTER TABLE exercise_logs
    ADD COLUMN exercise_id BIGINT;

-- Point each log at the newly created exercise that came from the same workout
UPDATE exercise_logs el
SET exercise_id = e.id
FROM exercises e
WHERE e.workout_id = el.workout_id;

-- Now enforce NOT NULL and FK
ALTER TABLE exercise_logs
    ALTER COLUMN exercise_id SET NOT NULL,
    ADD CONSTRAINT fk_exercise_logs_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;

-- Drop old workout_id FK and column
DROP INDEX IF EXISTS idx_exercise_logs_workout_id;
ALTER TABLE exercise_logs DROP COLUMN workout_id;

-- Recreate index on new column
CREATE INDEX idx_exercise_logs_exercise_id ON exercise_logs(exercise_id);

-- ────────────────────────────────────────────────────────────
-- Step 4: Strip exercise-specific columns from workouts
-- ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_workouts_video_id;
DROP INDEX IF EXISTS idx_workouts_last_trained;

ALTER TABLE workouts
    DROP COLUMN description,
    DROP COLUMN video_url,
    DROP COLUMN video_id,
    DROP COLUMN sets,
    DROP COLUMN reps,
    DROP COLUMN planned_weight,
    DROP COLUMN last_used_weight,
    DROP COLUMN last_trained_at;

-- ────────────────────────────────────────────────────────────
-- Done
-- Final schema:
--   training_splits → workouts → exercises
--   training_logs   → exercise_logs → exercises
-- ────────────────────────────────────────────────────────────