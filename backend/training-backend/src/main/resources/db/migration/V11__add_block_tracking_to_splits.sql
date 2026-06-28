ALTER TABLE training_splits
    ADD COLUMN current_block INTEGER NOT NULL DEFAULT 1
        CONSTRAINT chk_current_block CHECK (current_block BETWEEN 1 AND 3);
