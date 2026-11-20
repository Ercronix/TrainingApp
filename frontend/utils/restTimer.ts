/**
 * What the rest timer shows: `idle` (stopped or paused, `seconds` left), `running` (`seconds`
 * left) or `over` (the rest ran out `seconds` ago and the next one hasn't started yet).
 */
export type RestPhase = 'idle' | 'running' | 'over';

export interface RestStatus {
  phase: RestPhase;
  seconds: number;
}

/**
 * The rest timer's state at `now`, from the store's end time (kept after the rest runs out, so the
 * overtime can be counted from it) and the seconds left while it is stopped.
 */
export function restStatus(endTime: number | null, remaining: number, now: number): RestStatus {
  if (endTime == null) return { phase: 'idle', seconds: remaining };
  if (now < endTime) return { phase: 'running', seconds: Math.ceil((endTime - now) / 1000) };
  return { phase: 'over', seconds: Math.floor((now - endTime) / 1000) };
}

/** Whether a rest is counting down at `now` (not stopped, and not over). */
export const isRestRunning = (endTime: number | null, now: number) => endTime != null && now < endTime;

/** Seconds as a countdown clock, e.g. 01:30. */
export function formatRestClock(secs: number): string {
  const mins = Math.floor(secs / 60);
  return `${mins.toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
}

/** A rest length as a short label, e.g. 0:45, 2:00 or 2:30. */
export function formatRestLength(secs: number): string {
  return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
}

/** Time since the rest ran out, e.g. +0:42 or +12:05. */
export const formatOvertime = (secs: number) => `+${formatRestLength(secs)}`;
