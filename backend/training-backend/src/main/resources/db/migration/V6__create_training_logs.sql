-- Training Logs Table (Trainingseinheiten)
CREATE TABLE training_logs (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               split_id BIGINT NOT NULL REFERENCES training_splits(id) ON DELETE CASCADE,
                               started_at TIMESTAMP NOT NULL,
                               completed_at TIMESTAMP,
                               duration_seconds INT,
                               notes TEXT,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise Logs Table (Einzelne Übungen im Training)
CREATE TABLE exercise_logs (
                               id BIGSERIAL PRIMARY KEY,
                               training_log_id BIGINT NOT NULL REFERENCES training_logs(id) ON DELETE CASCADE,
                               workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
                               sets_completed INT DEFAULT 0,
                               reps_completed INT DEFAULT 0,
                               weight_used DECIMAL(5,2),
                               completed BOOLEAN DEFAULT false,
                               notes TEXT,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes
CREATE INDEX idx_training_logs_user_id ON training_logs(user_id);
CREATE INDEX idx_training_logs_split_id ON training_logs(split_id);
CREATE INDEX idx_training_logs_started_at ON training_logs(started_at);
CREATE INDEX idx_exercise_logs_training_log_id ON exercise_logs(training_log_id);
CREATE INDEX idx_exercise_logs_workout_id ON exercise_logs(workout_id);

-- Kommentare
COMMENT ON TABLE training_logs IS 'Aufgezeichnete Trainingseinheiten';
COMMENT ON TABLE exercise_logs IS 'Einzelne Übungen innerhalb eines Trainings';