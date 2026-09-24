-- ============================================================
-- Migration: Shared exercise library
--
-- An exercise's identity (name, notes, video, rep unit) moves into a
-- per-user `library_exercises` table. Workout exercises keep only their
-- plan (sets, reps, weight, order) and point at a library entry, so the
-- same movement can be used in several workouts and splits and its
-- history is tracked across all of them.
-- ============================================================

CREATE TABLE library_exercises (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    video_url   VARCHAR(500),
    video_id    VARCHAR(50),
    rep_unit    VARCHAR(10) NOT NULL DEFAULT 'reps',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Names are unique per user, ignoring case
CREATE UNIQUE INDEX uq_library_exercises_user_name ON library_exercises(user_id, LOWER(name));

-- ────────────────────────────────────────────────────────────
-- Backfill: one library entry per user and (trimmed, case-insensitive)
-- exercise name. When several exercises share a name, the entry takes its
-- fields from a template exercise over a temporary one, preferring rows that
-- have a video and notes, then the most recently updated.
-- ────────────────────────────────────────────────────────────
INSERT INTO library_exercises (user_id, name, description, video_url, video_id, rep_unit, created_at, updated_at)
SELECT DISTINCT ON (ts.user_id, LOWER(TRIM(e.name)))
    ts.user_id,
    TRIM(e.name),
    e.description,
    e.video_url,
    e.video_id,
    e.rep_unit,
    COALESCE(e.created_at, CURRENT_TIMESTAMP),
    e.updated_at
FROM exercises e
JOIN workouts w ON w.id = e.workout_id
JOIN training_splits ts ON ts.id = w.split_id
ORDER BY ts.user_id,
         LOWER(TRIM(e.name)),
         e.temporary ASC,
         (e.video_url IS NULL),
         (e.description IS NULL),
         e.updated_at DESC NULLS LAST;

ALTER TABLE exercises ADD COLUMN library_exercise_id BIGINT;

UPDATE exercises e
SET library_exercise_id = le.id
FROM workouts w, training_splits ts, library_exercises le
WHERE w.id = e.workout_id
  AND ts.id = w.split_id
  AND le.user_id = ts.user_id
  AND LOWER(le.name) = LOWER(TRIM(e.name));

-- NO ACTION (not RESTRICT) so deleting a user, which cascades to both
-- tables, is checked only at the end of the statement
ALTER TABLE exercises
    ALTER COLUMN library_exercise_id SET NOT NULL,
    ADD CONSTRAINT fk_exercises_library_exercise
        FOREIGN KEY (library_exercise_id) REFERENCES library_exercises(id);

CREATE INDEX idx_exercises_library_exercise_id ON exercises(library_exercise_id);

-- ────────────────────────────────────────────────────────────
-- Drop the identity columns that now live on the library entry
-- ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_exercises_video_id;

ALTER TABLE exercises
    DROP COLUMN name,
    DROP COLUMN description,
    DROP COLUMN video_url,
    DROP COLUMN video_id,
    DROP COLUMN rep_unit;
