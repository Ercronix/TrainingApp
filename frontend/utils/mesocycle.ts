import { TrainingSplit } from '@/types';
import { localDay } from '@/utils/stretch';

/** Lengths offered when planning a mesocycle (the server accepts 2 to 12 weeks). */
export const MESOCYCLE_LENGTHS = [4, 5, 6, 7, 8];

export interface MesocycleWeek {
  /** 1-based week of the running cycle. */
  week: number;
  length: number;
  /** 1-based: a new cycle starts on its own after each deload. */
  cycle: number;
  /** The last week of every cycle. */
  deload: boolean;
}

const DAY_MS = 86_400_000;

// A YYYY-MM-DD day as UTC midnight, so day counts aren't thrown off by DST
function parseDay(day: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function formatDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** The day `offset` days from a YYYY-MM-DD day. */
export function shiftDay(day: string, offset: number): string {
  const time = parseDay(day);
  if (time == null) return day;
  return formatDay(time + offset * DAY_MS);
}

/**
 * Where `today` (the device's local date, YYYY-MM-DD) falls in a mesocycle of `length` weeks
 * that started on `startDate`. Weeks are whole 7-day steps from the start, the last week is the
 * deload, and the next cycle follows on its own. Null without a mesocycle or before it starts.
 * Mirrors the server's Mesocycle.weekOf, which decides whether a new session is a deload.
 */
export function mesocycleWeek(
  length: number | null | undefined,
  startDate: string | null | undefined,
  today: string,
): MesocycleWeek | null {
  if (!length || length < 1 || !startDate) return null;
  const start = parseDay(startDate);
  const now = parseDay(today);
  if (start == null || now == null) return null;
  const days = Math.round((now - start) / DAY_MS);
  if (days < 0) return null;
  const weekIndex = Math.floor(days / 7);
  const week = (weekIndex % length) + 1;
  return { week, length, cycle: Math.floor(weekIndex / length) + 1, deload: week === length };
}

/** The split's week today, or null when it has no mesocycle (or it hasn't started yet). */
export function splitMesocycleWeek(
  split: Pick<TrainingSplit, 'mesocycleWeeks' | 'mesocycleStartDate'> | null | undefined,
  today = localDay(),
): MesocycleWeek | null {
  return split ? mesocycleWeek(split.mesocycleWeeks, split.mesocycleStartDate, today) : null;
}

/**
 * The start date that makes `today` fall in `week`. Keeps the weekday the weeks turn over on when
 * there already is a start date, so moving to another week doesn't shift the week boundaries.
 */
export function startDateForWeek(week: number, today: string, currentStart?: string | null): string {
  const start = currentStart ? parseDay(currentStart) : null;
  const now = parseDay(today);
  const daysIntoWeek = start != null && now != null && now >= start
    ? Math.round((now - start) / DAY_MS) % 7
    : 0;
  return shiftDay(today, -daysIntoWeek - (week - 1) * 7);
}

/** "WEEK 3 OF 5", or "DELOAD WEEK". */
export function formatMesocycleWeek(week: MesocycleWeek): string {
  return week.deload ? 'DELOAD WEEK' : `WEEK ${week.week} OF ${week.length}`;
}
