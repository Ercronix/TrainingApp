-- ============================================================
-- Migration: Daily stretch reminder via ntfy
--
-- The backend publishes to the user's own, randomly named ntfy topic
-- at remind_at in their time zone, unless they already stretched that
-- day. done_token lets the notification's "Done" button check the day
-- off without a login, so both are secrets.
-- ============================================================

CREATE TABLE stretch_reminders (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    remind_at    TIME NOT NULL,
    time_zone    VARCHAR(64) NOT NULL,
    topic        VARCHAR(64) NOT NULL UNIQUE,
    done_token   VARCHAR(64) NOT NULL UNIQUE,
    -- The user's local day the last reminder went out, so each day gets at most one
    last_sent_on DATE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stretch_reminders_enabled ON stretch_reminders(enabled) WHERE enabled;
