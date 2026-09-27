import { CatalogExercise, LibraryExercise, Muscle, MuscleTarget, TrainingLog } from '@/types';
import { MUSCLE_LABELS, SECONDARY_SET_WEIGHT } from '@/constants/muscles';
import { startOfWeek } from '@/utils/stats';
import { setsOf, workingSets } from '@/utils/sets';

// ─── Catalog search ─────────────────────────────────────────────────────────

const ABBREVIATIONS: Record<string, string[]> = {
  db: ['dumbbell'],
  bb: ['barbell'],
  kb: ['kettlebell'],
  ohp: ['overhead', 'press'],
  rdl: ['romanian', 'deadlift'],
  sldl: ['stiff', 'legged', 'deadlift'],
};

const STOPWORDS = new Set(['with', 'the', 'on', 'to', 'a', 'of', 'and']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .flatMap((t) => ABBREVIATIONS[t] ?? [t])
    // Crude singular so "curls" finds "curl" and "pullups" finds "pullup"
    .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t));
}

const compact = (tokens: string[]) => tokens.join('');

// Short gym names for the big lifts, and the catalog variant they usually mean
const ALIASES: [string[], string][] = [
  [['bench', 'bench press', 'flat bench'], 'Barbell Bench Press - Medium Grip'],
  [['incline bench', 'incline bench press'], 'Barbell Incline Bench Press - Medium Grip'],
  [['squat', 'back squat'], 'Barbell Squat'],
  [['front squat'], 'Front Barbell Squat'],
  [['deadlift'], 'Barbell Deadlift'],
  [['overhead press', 'military press', 'shoulder press'], 'Standing Military Press'],
  [['row', 'barbell row', 'bent over row'], 'Bent Over Barbell Row'],
  [['cable row'], 'Seated Cable Rows'],
  [['pulldown', 'lat pulldown'], 'Wide-Grip Lat Pulldown'],
  [['pull up', 'pullup'], 'Pullups'],
  [['push up', 'pushup'], 'Pushups'],
  [['dip'], 'Dips - Triceps Version'],
  [['hip thrust'], 'Barbell Hip Thrust'],
  [['curl', 'bicep curl', 'biceps curl'], 'Barbell Curl'],
  [['pushdown', 'tricep pushdown'], 'Triceps Pushdown'],
  [['skull crusher'], 'EZ-Bar Skullcrusher'],
  [['fly', 'chest fly'], 'Dumbbell Flyes'],
  [['shrug'], 'Barbell Shrug'],
  [['lunge'], 'Dumbbell Lunges'],
  [['bulgarian split squat', 'split squat'], 'Split Squat with Dumbbells'],
  [['leg curl'], 'Lying Leg Curls'],
  [['calf raise'], 'Standing Calf Raises'],
];

const ALIAS_BY_QUERY = new Map(
  ALIASES.flatMap(([queries, name]) => queries.map((q) => [tokenize(q).join(' '), name] as const)),
);

interface Scored {
  entry: CatalogExercise;
  matched: number;
  extra: number;
}

/**
 * Catalog exercises matching a name, best first. With `requireAll`, every word has to match
 * (by prefix, for search as you type); otherwise half of them is enough, which suits matching
 * short gym names like "Bench Press" against the catalog's longer ones.
 */
export function searchCatalog(
  catalog: CatalogExercise[],
  query: string,
  { limit = 5, requireAll = true }: { limit?: number; requireAll?: boolean } = {},
): CatalogExercise[] {
  const q = tokenize(query);
  if (q.length === 0) return [];
  const qCompact = compact(q);

  const scored: Scored[] = [];
  for (const entry of catalog) {
    const n = tokenize(entry.name);
    // "pull up" and "pull-up" both match "Pullups"
    if (qCompact.length >= 4 && compact(n).includes(qCompact)) {
      scored.push({ entry, matched: q.length, extra: Math.max(0, n.length - 1) });
      continue;
    }
    const matched = q.filter((t) => n.some((w) => w === t || w.startsWith(t))).length;
    if (requireAll ? matched < q.length : matched === 0 || matched / q.length < 0.5) continue;
    scored.push({ entry, matched, extra: n.length - matched });
  }

  // Plain strength variants first; powerlifting and strongman versions are usually specialties
  const categoryRank = (c: string) => (c === 'strength' ? 0 : 1);
  const alias = ALIAS_BY_QUERY.get(q.join(' '));
  const aliased = alias ? catalog.find((e) => e.name === alias) : undefined;
  if (aliased) {
    const index = scored.findIndex((s) => s.entry === aliased);
    if (index >= 0) scored.splice(index, 1);
  }

  const ranked = scored
    .sort((a, b) =>
      b.matched - a.matched
      || categoryRank(a.entry.category) - categoryRank(b.entry.category)
      || a.extra - b.extra
      || a.entry.name.length - b.entry.name.length)
    .map((s) => s.entry);
  return (aliased ? [aliased, ...ranked] : ranked).slice(0, limit);
}

// ─── Display ────────────────────────────────────────────────────────────────

export function primaryMuscles(muscles: MuscleTarget[]): Muscle[] {
  return muscles.filter((m) => m.role === 'PRIMARY').map((m) => m.muscle);
}

export function secondaryMuscles(muscles: MuscleTarget[]): Muscle[] {
  return muscles.filter((m) => m.role === 'SECONDARY').map((m) => m.muscle);
}

export const muscleNames = (muscles: Muscle[]) => muscles.map((m) => MUSCLE_LABELS[m]).join(', ');

/** Order-insensitive comparison, so an unchanged selection isn't sent to the server. */
export function sameMuscles(a: MuscleTarget[], b: MuscleTarget[]): boolean {
  if (a.length !== b.length) return false;
  const roles = new Map(a.map((m) => [m.muscle, m.role]));
  return b.every((m) => roles.get(m.muscle) === m.role);
}

// ─── Weekly sets per muscle ─────────────────────────────────────────────────

export interface MuscleWeek {
  start: number;
  sets: Partial<Record<Muscle, number>>;
  /** Working sets of library entries without muscles, which count for nothing. */
  untaggedSets: number;
  /** Library entries without muscles that were trained this week. */
  untaggedIds: Set<number>;
}

export interface MuscleVolume {
  /** Oldest first; the last one is the running week. */
  weeks: MuscleWeek[];
}

const logDate = (log: TrainingLog) => new Date(log.completedAt ?? log.startedAt).getTime();

/**
 * Working sets (warm-ups excluded) per muscle and calendar week, over completed exercises of
 * completed sessions. A set counts once for each primary muscle and half for each secondary.
 */
export function computeMuscleVolume(
  logs: TrainingLog[],
  library: LibraryExercise[],
  weekCount = 5,
  now = Date.now(),
): MuscleVolume {
  const musclesById = new Map(library.map((e) => [e.id, e.muscles ?? []]));
  const thisWeek = startOfWeek(now);
  const weeks: MuscleWeek[] = Array.from({ length: weekCount }, (_, i) => {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - (weekCount - 1 - i) * 7);
    return { start: d.getTime(), sets: {}, untaggedSets: 0, untaggedIds: new Set() };
  });
  const weekIndex = new Map(weeks.map((w, i) => [w.start, i]));

  for (const log of logs) {
    if (!log.isCompleted) continue;
    const index = weekIndex.get(startOfWeek(logDate(log)));
    if (index == null) continue;
    const week = weeks[index];
    for (const ex of log.exercises ?? []) {
      if (!ex.completed) continue;
      const sets = workingSets(setsOf(ex)).length;
      if (sets === 0) continue;
      const muscles = musclesById.get(ex.libraryExerciseId) ?? [];
      if (muscles.length === 0) {
        week.untaggedSets += sets;
        week.untaggedIds.add(ex.libraryExerciseId);
        continue;
      }
      for (const { muscle, role } of muscles) {
        week.sets[muscle] = (week.sets[muscle] ?? 0) + sets * (role === 'PRIMARY' ? 1 : SECONDARY_SET_WEIGHT);
      }
    }
  }

  return { weeks };
}
