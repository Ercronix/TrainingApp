-- Optional 1-5 ratings the user gives a session: how it felt, their energy and how well they
-- slept the night before. The session note already exists (training_logs.notes).
ALTER TABLE training_logs
    ADD COLUMN rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    ADD COLUMN energy INTEGER CHECK (energy BETWEEN 1 AND 5),
    ADD COLUMN sleep  INTEGER CHECK (sleep BETWEEN 1 AND 5);
