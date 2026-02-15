CREATE TABLE training_splits (
                                 id BIGSERIAL PRIMARY KEY,
                                 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 name VARCHAR(100) NOT NULL,
                                 is_active BOOLEAN DEFAULT false,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_splits_user_id ON training_splits(user_id);
CREATE INDEX idx_training_splits_is_active ON training_splits(is_active);

-- Constraint: Nur ein aktiver Split pro User
CREATE UNIQUE INDEX idx_one_active_split_per_user
    ON training_splits(user_id, is_active)
    WHERE is_active = true;