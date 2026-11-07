-- ============================================================
-- Migration: Daily stretching
--
-- A stretch routine is kept apart from the training data: its items
-- have no library entry and no muscles, so they never count toward
-- volume or any other stat. A check-in marks a day (in the user's own
-- time zone, as the client sends it) on which the user stretched.
-- ============================================================

-- One routine per user for now
CREATE TABLE stretch_routines (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A stretch held for `amount` seconds or repeated `amount` times, on each side when per_side
CREATE TABLE stretch_items (
    id          BIGSERIAL PRIMARY KEY,
    routine_id  BIGINT NOT NULL REFERENCES stretch_routines(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    kind        VARCHAR(10) NOT NULL CHECK (kind IN ('hold', 'reps')),
    amount      INTEGER NOT NULL CHECK (amount > 0),
    per_side    BOOLEAN NOT NULL DEFAULT FALSE,
    note        TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stretch_items_routine ON stretch_items(routine_id, order_index);

CREATE TABLE stretch_check_ins (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day          DATE NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, day)
);
