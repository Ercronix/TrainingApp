#!/usr/bin/env node
// Give a user realistic data in the LOCAL dev database: an active Upper/Lower split with
// catalog exercises (muscles and drawings), plus completed sessions spread over past weeks
// with progressing weights, so stats, charts, the calendar and "previous session" values
// have something to show.
//
//   node seed.mjs [--login new | <user>:<pass>] [--weeks 6] [--per-week 3]
//
// Sessions go through the API, then their dates are moved into the past with SQL in the
// training-db container (the API always stamps "now"). Never point this at production.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = execFileSync("git", ["-C", import.meta.dirname, "rev-parse", "--show-toplevel"]).toString().trim();
const API = "http://localhost:8080/api";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const login = opt("login", "new");
const weeks = Number(opt("weeks", 6));
const perWeek = Number(opt("per-week", 3));

let token;
async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Sign in
let username, password;
if (login === "new") {
  username = `seed_${Math.random().toString(36).slice(2, 8)}`;
  password = "password123";
  ({ token } = await call("POST", "/auth/register", { username, email: `${username}@example.com`, password }));
} else {
  [username, password] = [login.split(":")[0], login.split(":").slice(1).join(":")];
  ({ token } = await call("POST", "/auth/login", { username, password }));
}
const { userId } = await call("GET", "/auth/me");

// Plan: each slot names catalog candidates in order of preference (free-exercise-db names)
const plan = {
  Upper: [
    { pick: [/^barbell bench press - medium grip$/i, /bench press/i], sets: 3, reps: 8, start: 60, step: 2.5 },
    { pick: [/^bent over barbell row$/i, /barbell row/i], sets: 3, reps: 10, start: 50, step: 2.5 },
    { pick: [/^standing military press$/i, /military press|shoulder press/i], sets: 3, reps: 8, start: 35, step: 1.25 },
    { pick: [/^wide-grip lat pulldown$/i, /lat pulldown/i], sets: 3, reps: 10, start: 45, step: 2.5 },
    { pick: [/^barbell curl$/i, /curl/i], sets: 3, reps: 12, start: 25, step: 1.25 },
  ],
  Lower: [
    { pick: [/^barbell full squat$/i, /^barbell squat$/i, /squat/i], sets: 3, reps: 6, start: 80, step: 2.5 },
    { pick: [/^romanian deadlift$/i, /deadlift/i], sets: 3, reps: 8, start: 70, step: 2.5 },
    { pick: [/^leg press$/i, /leg press/i], sets: 3, reps: 12, start: 120, step: 5 },
    { pick: [/^standing calf raises$/i, /calf raise/i], sets: 4, reps: 15, start: 60, step: 2.5 },
  ],
};

const catalog = await call("GET", "/exercise-catalog");
function pickCatalog(patterns) {
  for (const re of patterns) {
    const hits = catalog.filter((c) => re.test(c.name));
    const hit = hits.find((c) => c.hasIllustration) ?? hits[0];
    if (hit) return hit;
  }
  return null;
}

// Split, workouts, exercises
const split = await call("POST", "/splits", { name: "Upper / Lower" });
await call("PUT", `/splits/${split.id}/activate`);
const workouts = [];
for (const [name, slots] of Object.entries(plan)) {
  const workout = await call("POST", `/workouts/split/${split.id}`, { name });
  for (const slot of slots) {
    const c = pickCatalog(slot.pick);
    if (!c) throw new Error(`no catalog exercise for ${slot.pick}`);
    slot.name = c.name;
    await call("POST", `/workouts/${workout.id}/exercises`, {
      name: c.name,
      sets: slot.sets,
      reps: slot.reps,
      plannedWeight: slot.start,
      equipment: c.equipment,
      muscles: c.muscles,
      catalogExerciseId: c.id,
    });
  }
  workouts.push({ ...workout, slots });
}

// Sessions, oldest first, alternating workouts; weights go up every other session
const sessions = [];
const total = weeks * perWeek;
const gap = 7 / perWeek;
for (let i = 0; i < total; i++) {
  const workout = workouts[i % workouts.length];
  const round = Math.floor(i / workouts.length);
  const log = await call("POST", "/training-logs/start", { workoutId: workout.id });
  const full = await call("GET", `/training-logs/${log.id}`);
  for (const ex of full.exercises) {
    const slot = workout.slots.find((s) => s.name === ex.exerciseName) ?? workout.slots[0];
    const weight = slot.start + slot.step * Math.floor(round / 2);
    const sets = Array.from({ length: slot.sets }, (_, s) => ({
      reps: Math.max(1, slot.reps - (s === slot.sets - 1 && round % 2 ? 1 : 0)),
      weight,
    }));
    await call("PUT", `/training-logs/exercise-logs/${ex.id}`, { sets, completed: true });
  }
  await call("PUT", `/training-logs/${log.id}/complete`, {});
  const daysAgo = Math.max(1, Math.round((total - i) * gap));
  sessions.push({ id: log.id, daysAgo, minutes: 45 + ((i * 7) % 25) });
}

// Move the sessions into the past (delta per session applied to every timestamp it owns)
const env = Object.fromEntries(
  readFileSync(join(ROOT, "backend/.env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const values = sessions.map((s) => `(${s.id}, ${s.daysAgo}, ${s.minutes})`).join(",");
const sql = `
BEGIN;
CREATE TEMP TABLE shift AS
  SELECT t.id, t.started_at - (date_trunc('day', now()) - make_interval(days => v.days) + interval '17 hours') AS delta, v.minutes
  FROM training_logs t JOIN (VALUES ${values}) AS v(id, days, minutes) ON v.id = t.id
  WHERE t.user_id = ${Number(userId)};
UPDATE training_logs t SET
  started_at = t.started_at - s.delta,
  completed_at = t.started_at - s.delta + make_interval(mins => s.minutes),
  last_activity_at = t.started_at - s.delta + make_interval(mins => s.minutes),
  duration_seconds = s.minutes * 60,
  created_at = t.created_at - s.delta,
  updated_at = t.started_at - s.delta + make_interval(mins => s.minutes)
FROM shift s WHERE s.id = t.id;
UPDATE exercise_logs e SET created_at = e.created_at - s.delta, updated_at = e.updated_at - s.delta
FROM shift s WHERE s.id = e.training_log_id;
UPDATE set_logs sl SET created_at = sl.created_at - s.delta, updated_at = sl.updated_at - s.delta
FROM exercise_logs e JOIN shift s ON s.id = e.training_log_id WHERE e.id = sl.exercise_log_id;
COMMIT;`;
execFileSync("docker", ["exec", "-i", "training-db", "psql", "-q", "-v", "ON_ERROR_STOP=1", "-U", env.POSTGRES_USER, "-d", env.POSTGRES_DB], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});

console.log(`seeded ${username}:${password} with split "${split.name}" and ${total} sessions over ${weeks} weeks`);
