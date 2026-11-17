-- ============================================================
-- Migration: Body weight log
--
-- One entry per user and day (the client's local date). Logging a
-- day that already has an entry replaces it. Weight is in kg, with
-- the same precision as the training weights.
-- ============================================================

CREATE TABLE body_weight_entries (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day        DATE NOT NULL,
    weight     DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    note       TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, day)
);
