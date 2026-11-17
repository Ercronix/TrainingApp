-- ============================================================
-- Migration: Supersets and circuits
--
-- Exercises of a workout that share a superset group are done
-- back to back, a set of each before resting: a superset with
-- two of them, a circuit with more. The group number is unique
-- within the workout and its members stay adjacent by
-- order_index; ExerciseService keeps that up when exercises are
-- reordered or deleted, and clears a group left with only one
-- member. Temporary (session-only) exercises are never grouped.
-- ============================================================

ALTER TABLE exercises ADD COLUMN superset_group INTEGER;
