CREATE TABLE workouts (
                          id BIGSERIAL PRIMARY KEY,
                          split_id BIGINT NOT NULL REFERENCES training_splits(id) ON DELETE CASCADE,
                          name VARCHAR(100) NOT NULL,
                          description TEXT,
                          order_index INT DEFAULT 0,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workouts_split_id ON workouts(split_id);
CREATE INDEX idx_workouts_order ON workouts(split_id, order_index);