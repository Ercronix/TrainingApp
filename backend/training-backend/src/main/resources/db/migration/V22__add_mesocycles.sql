-- Optional planned mesocycle on a split: its length in weeks, the last of which is a deload, and
-- the client's local date its first week started on. Both are set, or both null (no mesocycle).
ALTER TABLE training_splits
    ADD COLUMN mesocycle_weeks INTEGER
        CONSTRAINT chk_mesocycle_weeks CHECK (mesocycle_weeks BETWEEN 2 AND 12),
    ADD COLUMN mesocycle_start_date DATE,
    ADD CONSTRAINT chk_mesocycle_complete CHECK ((mesocycle_weeks IS NULL) = (mesocycle_start_date IS NULL));

-- Sessions started in a deload week: lowered targets, and left out of the progression trend
ALTER TABLE training_logs ADD COLUMN deload BOOLEAN NOT NULL DEFAULT FALSE;
