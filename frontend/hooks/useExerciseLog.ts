import { useUpdateExerciseLog } from './useUpdateExerciseLog';
import { SetLog } from '@/types';

export function useExerciseLog(exerciseLogId: string, trainingLogId: string) {
  const mutation = useUpdateExerciseLog(trainingLogId);

  /**
   * Replaces the exercise's logged sets. Called on every change, so each request carries
   * the full list: replaying a queued one (offline, after a restart) can't duplicate sets.
   * `completed` is left unchanged when undefined.
   */
  const saveSets = (sets: SetLog[], completed: boolean | undefined) => {
    mutation.mutate({
      exerciseLogId: Number(exerciseLogId),
      data: { sets, completed },
    });
  };

  return { saveSets };
}
