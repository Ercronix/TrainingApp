import { StretchItem } from '@/types';

// Rough time per repetition, for the routine's total
const SECONDS_PER_REP = 4;

/** The device's local calendar date as YYYY-MM-DD, the form check-ins are stored in. */
export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calendar day `offset` days from `date` (DST-safe, unlike adding offset * 24h). */
export function addDays(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * Days in a row with a check-in, up to today. The streak stays alive until the end of today, so
 * it counts from yesterday while today is still open.
 */
export function stretchStreak(days: Set<string>, today = new Date()): number {
  let day = days.has(localDay(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(localDay(day))) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** About how long the routine takes, in seconds. */
export function routineSeconds(items: StretchItem[]): number {
  return items.reduce((sum, item) => {
    const once = item.kind === 'hold' ? item.amount : item.amount * SECONDS_PER_REP;
    return sum + once * (item.perSide ? 2 : 1);
  }, 0);
}

/** 0:45, 8:30 */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 30s, 1:30, 10 reps */
export function formatAmount(item: Pick<StretchItem, 'kind' | 'amount'>): string {
  if (item.kind === 'reps') return `${item.amount} ${item.amount === 1 ? 'rep' : 'reps'}`;
  return item.amount < 60 ? `${item.amount}s` : formatClock(item.amount);
}

export type StretchSide = 'left' | 'right' | null;

/** One step of a guided session: a stretch, or one side of a stretch done on each side. */
export interface StretchStep {
  item: StretchItem;
  side: StretchSide;
}

export function sessionSteps(items: StretchItem[]): StretchStep[] {
  return items.flatMap((item): StretchStep[] =>
    item.perSide ? [{ item, side: 'left' }, { item, side: 'right' }] : [{ item, side: null }],
  );
}

/** Monday to Sunday of the week containing `today`. */
export function weekDays(today = new Date()): Date[] {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
