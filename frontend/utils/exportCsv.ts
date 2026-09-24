import { Platform, Share } from 'react-native';
import { SetLog, TrainingLog } from '@/types';
import { setsOf } from './sets';

const HEADER = [
  'date', 'split', 'workout', 'exercise', 'completed',
  'set', 'warmup', 'reps', 'unit', 'weight_kg', 'rpe', 'notes', 'session_duration_min',
];

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per logged set (or per exercise without sets) of each completed session, oldest first. */
export function trainingLogsToCsv(logs: TrainingLog[]): string {
  const rows = logs
    .filter((log) => log.isCompleted)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((log) =>
      log.exercises.flatMap((e) => {
        const sets = setsOf(e);
        const row = (set: SetLog | null, index: number) => [
          log.startedAt.slice(0, 10),
          log.splitName,
          log.workoutName,
          e.exerciseName,
          e.completed ? 'yes' : 'no',
          set ? index + 1 : '',
          set ? (set.warmup ? 'yes' : 'no') : '',
          set?.reps,
          e.repUnit ?? 'reps',
          set?.weight,
          set?.rpe,
          e.notes,
          log.durationSeconds != null ? Math.round(log.durationSeconds / 60) : '',
        ];
        return sets.length > 0 ? sets.map(row) : [row(null, 0)];
      }),
    );
  return [HEADER, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export async function shareCsv(csv: string, filename: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  // Share sheet with the CSV as text: paste into Sheets, save to a notes app, email it, ...
  await Share.share({ title: filename, message: csv });
}
