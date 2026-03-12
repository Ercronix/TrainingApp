-- Migration: Support ad-hoc exercises that are only meant for a single training session.
-- We keep them in `exercises` so logs can reference them, but mark them as temporary so they
-- are excluded from workout templates by default.

ALTER TABLE exercises
    ADD COLUMN temporary BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_exercises_temporary ON exercises(temporary);

