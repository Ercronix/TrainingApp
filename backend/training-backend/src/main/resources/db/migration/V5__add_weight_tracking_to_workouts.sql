-- Add weight tracking columns to workouts
ALTER TABLE workouts
    ADD COLUMN sets INT,
    ADD COLUMN reps INT,
    ADD COLUMN planned_weight DECIMAL(5,2),
    ADD COLUMN last_used_weight DECIMAL(5,2),
    ADD COLUMN last_trained_at TIMESTAMP;

-- Indizes für Performance
CREATE INDEX idx_workouts_last_trained ON workouts(last_trained_at);

-- Kommentar hinzufügen
COMMENT ON COLUMN workouts.planned_weight IS 'Geplantes Gewicht für diese Übung';
COMMENT ON COLUMN workouts.last_used_weight IS 'Letztes tatsächlich verwendetes Gewicht';
COMMENT ON COLUMN workouts.last_trained_at IS 'Zeitpunkt des letzten Trainings';