-- Add video columns to workouts table
ALTER TABLE workouts
    ADD COLUMN video_url VARCHAR(500),
    ADD COLUMN video_id VARCHAR(50);

-- Index for video lookups (optional)
CREATE INDEX idx_workouts_video_id ON workouts(video_id);