import { useRouter } from 'expo-router';
import { alert } from '@/utils/confirm';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';
import { useExerciseProgress } from './useExerciseProgress';
import { detectPersonalRecord, estimateOneRepMax, getPersonalRecords } from '@/utils/strength';
import { workingSets } from '@/utils/sets';
import { SetLog } from '@/types';

export function useExerciseLog(exerciseLogId: string, trainingLogId: string, exerciseId?: string) {
  const router = useRouter();
  const mutation = useUpdateExerciseLog(trainingLogId);
  const { progress } = useExerciseProgress(exerciseId ?? '');

  const saveExercise = (sets: SetLog[]) => {
    mutation.mutate({
      exerciseLogId: Number(exerciseLogId),
      data: { sets, completed: true },
    });

    // Optimistic: don't wait for the server (it may be unreachable at the gym)
    router.back();

    if (!progress) return;
    // Check the heaviest set first, then the one with the best estimated 1RM
    const working = workingSets(sets).filter((s) => Number(s.weight ?? 0) > 0);
    const byWeight = [...working].sort((a, b) => Number(b.weight) - Number(a.weight) || b.reps - a.reps)[0];
    const byOneRepMax = [...working].sort((a, b) =>
      estimateOneRepMax(Number(b.weight), b.reps) - estimateOneRepMax(Number(a.weight), a.reps))[0];
    const records = getPersonalRecords(progress.entries);
    const record = [byWeight, byOneRepMax]
      .filter((s): s is SetLog => s != null)
      .map((s) => detectPersonalRecord(records, Number(s.weight), s.reps))
      .find((r) => r != null);
    if (record) alert('New personal record! 🏆', record);
  };

  return { saveExercise, isPending: mutation.isPending };
}
