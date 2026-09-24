-- ============================================================
-- Migration: Per-set logging
--
-- An exercise log used to hold a single sets/reps/weight triple, so a
-- pyramid (3×8 at 60/65/70) couldn't be recorded. Each performed set now
-- gets its own row. The columns on exercise_logs stay as a summary of the
-- working sets (count, and reps/weight of the heaviest set).
-- ============================================================

CREATE TABLE set_logs (
    id              BIGSERIAL PRIMARY KEY,
    exercise_log_id BIGINT NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
    set_index       INT NOT NULL,
    reps            INT NOT NULL DEFAULT 0,
    weight          DECIMAL(5,2),
    rpe             DECIMAL(3,1),
    warmup          BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_set_logs_exercise_log_index UNIQUE (exercise_log_id, set_index)
);

-- ────────────────────────────────────────────────────────────
-- Backfill: expand each logged triple into that many identical sets
-- ────────────────────────────────────────────────────────────
INSERT INTO set_logs (exercise_log_id, set_index, reps, weight, created_at, updated_at)
SELECT el.id,
       s.i,
       COALESCE(el.reps_completed, 0),
       el.weight_used,
       COALESCE(el.created_at, CURRENT_TIMESTAMP),
       el.updated_at
FROM exercise_logs el
CROSS JOIN LATERAL generate_series(0, el.sets_completed - 1) AS s(i)
WHERE el.sets_completed > 0;
