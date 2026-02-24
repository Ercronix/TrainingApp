-- ============================================================
-- Migration: Add workout reference to training_logs
--
-- What this does:
--   1. Add workout_id column to training_logs
--   2. Backfill existing training logs with the workout from their first exercise
--   3. Make workout_id NOT NULL and add foreign key constraint
--   4. Add index for performance
-- ============================================================

-- Step 1: Add workout_id column (nullable initially)
ALTER TABLE training_logs
    ADD COLUMN workout_id BIGINT REFERENCES workouts(id) ON DELETE CASCADE;

-- Step 2: Backfill existing training logs
-- For each training log, get the workout from its first exercise log
UPDATE training_logs tl
SET workout_id = (
    SELECT e.workout_id
    FROM exercise_logs el
             JOIN exercises e ON e.id = el.exercise_id
    WHERE el.training_log_id = tl.id
    LIMIT 1
)
WHERE tl.workout_id IS NULL;

-- Step 3: Make workout_id NOT NULL and add index
ALTER TABLE training_logs
    ALTER COLUMN workout_id SET NOT NULL;

CREATE INDEX idx_training_logs_workout_id ON training_logs(workout_id);

-- Step 4: Add comment
COMMENT ON COLUMN training_logs.workout_id IS 'The specific workout day that was trained';