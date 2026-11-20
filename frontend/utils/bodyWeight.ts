import { BodyWeightEntry } from '@/types';
import { localDay } from '@/utils/stretch';

const DAY_MS = 86_400_000;

/** The heaviest body weight the server accepts (DECIMAL(5,2)). */
export const MAX_BODY_WEIGHT = 999.99;

/** Days since the epoch of a YYYY-MM-DD date, independent of time zone and DST. */
export function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Local midnight of a YYYY-MM-DD date, as a timestamp for charts. */
export function dayTime(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Entries by date, oldest first, without mutating the input. */
export function sortEntries(entries: BodyWeightEntry[]): BodyWeightEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** The list after logging `entry`, which replaces an entry on the same date (as the server does). */
export function upsertEntry(entries: BodyWeightEntry[], entry: BodyWeightEntry): BodyWeightEntry[] {
  const existing = entries.find((e) => e.date === entry.date);
  const merged = { ...entry, id: entry.id ?? existing?.id };
  return sortEntries([...entries.filter((e) => e.date !== entry.date), merged]);
}

export function removeEntry(entries: BodyWeightEntry[], date: string): BodyWeightEntry[] {
  return entries.filter((e) => e.date !== date);
}

/**
 * The entry closest in calendar days to `time` (a timestamp, read in local time), or null when
 * there are none. On a tie the earlier entry wins: the weight before a session, not after it.
 */
export function nearestEntry(entries: BodyWeightEntry[], time: number): BodyWeightEntry | null {
  const target = dayNumber(localDay(new Date(time)));
  let best: BodyWeightEntry | null = null;
  let bestDistance = Infinity;
  for (const entry of entries) {
    const n = dayNumber(entry.date);
    const distance = Math.abs(n - target);
    if (distance < bestDistance || (distance === bestDistance && best && n < dayNumber(best.date))) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best;
}

export interface RelativeStrength {
  /** The lift divided by the body weight (e.g. 1.5 for 1.5 × BW). */
  ratio: number;
  /** The body-weight entry it was divided by. */
  bodyWeight: BodyWeightEntry;
}

/** A lift (e.g. the best e1RM) as a multiple of the body weight nearest to when it was done. */
export function relativeStrength(load: number, time: number, entries: BodyWeightEntry[]): RelativeStrength | null {
  if (!(load > 0)) return null;
  const bodyWeight = nearestEntry(entries, time);
  if (!bodyWeight || !(Number(bodyWeight.weight) > 0)) return null;
  return { ratio: load / Number(bodyWeight.weight), bodyWeight };
}

/**
 * For each entry (sorted by date), the mean of the entries in the `windowDays` calendar days up
 * to and including it. Gaps simply mean fewer entries in the window.
 */
export function movingAverage(entries: BodyWeightEntry[], windowDays = 7): { date: string; value: number }[] {
  const sorted = sortEntries(entries);
  const days = sorted.map((e) => dayNumber(e.date));
  let start = 0;
  let sum = 0;
  return sorted.map((entry, i) => {
    sum += Number(entry.weight);
    while (days[i] - days[start] >= windowDays) {
      sum -= Number(sorted[start].weight);
      start++;
    }
    return { date: entry.date, value: sum / (i - start + 1) };
  });
}

/** A typed weight in kg ("80,5" works too), rounded to 0.01, or null when it isn't a valid one. */
export function parseWeight(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(trimmed)) return null;
  const value = Math.round(Number(trimmed) * 100) / 100;
  return value > 0 && value <= MAX_BODY_WEIGHT ? value : null;
}

/** `weight` moved by `delta`, kept on the 0.1 kg grid and within the accepted range. */
export function stepWeight(weight: number, delta: number): number {
  const next = Math.round((weight + delta) * 10) / 10;
  return Math.min(MAX_BODY_WEIGHT, Math.max(0.1, next));
}

/** A weight with up to two decimals and no trailing zeros, e.g. 80, 80.5, 80.25. */
export function formatWeight(weight: number): string {
  return String(Math.round(weight * 100) / 100);
}

/**
 * The change from the body weight nearest to `days` days before the latest entry, or null without
 * an entry at least half that far back (so a week-old log doesn't pass for a 30-day change).
 */
export function changeOver(entries: BodyWeightEntry[], days: number): number | null {
  const sorted = sortEntries(entries);
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;
  const past = nearestEntry(sorted, dayTime(latest.date) - days * DAY_MS + DAY_MS / 2);
  if (!past || dayNumber(latest.date) - dayNumber(past.date) < days / 2) return null;
  return Number(latest.weight) - Number(past.weight);
}
