-- When anything was last logged in a session (sets, added, swapped or removed exercises).
-- Clients end a session that has had no input for a while, backdated to this time.
ALTER TABLE training_logs ADD COLUMN last_activity_at TIMESTAMP;

UPDATE training_logs t
SET last_activity_at = GREATEST(
    t.started_at,
    COALESCE((SELECT MAX(e.updated_at) FROM exercise_logs e WHERE e.training_log_id = t.id), t.started_at));

ALTER TABLE training_logs ALTER COLUMN last_activity_at SET NOT NULL;
