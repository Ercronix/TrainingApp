import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { AddExerciseLogVariables, MUTATION_KEYS, trainingScope } from '@/services/queryClient';
import { MuscleTarget ,ExerciseLog, TrainingLog } from '@/types';

export interface AddExerciseLogDto {
  libraryExerciseId?: number;
  name?: string;
  sets?: number | null;
  reps?: number | null;
  plannedWeight?: number | null;
  muscles?: MuscleTarget[];
  addToWorkout: boolean;
}

/**
 * Adds an exercise to a running session. The row shows up immediately with a temporary
 * (negative) id — also while offline, where the request is paused (and persisted) until the
 * connection returns. It can't be logged until the server has assigned its real id.
 */
export function useAddExerciseLog(trainingLogId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation<ExerciseLog, unknown, AddExerciseLogVariables & { exerciseName: string }, { previous?: TrainingLog }>({
    mutationKey: MUTATION_KEYS.addExerciseLog,
    scope: trainingScope(trainingLogId ?? ''),
    onMutate: async ({ data, exerciseName }) => {
      const queryKey = QUERY_KEYS.training(trainingLogId ?? '');
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrainingLog>(queryKey);
      if (previous) {
        const pending: ExerciseLog = {
          id: -Date.now(),
          exerciseId: -1,
          libraryExerciseId: data.libraryExerciseId ?? -1,
          exerciseName,
          workoutId: previous.workoutId,
          workoutName: previous.workoutName,
          plannedSets: data.sets ?? null,
          plannedReps: data.reps ?? null,
          plannedWeight: data.plannedWeight ?? null,
          setsCompleted: 0,
          repsCompleted: 0,
          weightUsed: null,
          sets: [],
          completed: false,
          notes: null,
          repUnit: null,
          previousSets: null,
          previousReps: null,
          previousWeight: null,
        };
        queryClient.setQueryData<TrainingLog>(queryKey, { ...previous, exercises: [...previous.exercises, pending] });
      }
      router.back();
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.training(trainingLogId ?? ''), context.previous);
      alert('Error', getErrorMessage(error));
    },
  });

  const addExerciseLog = (data: AddExerciseLogDto, exerciseName: string) => {
    if (!trainingLogId) return;
    mutation.mutate({ trainingLogId: Number(trainingLogId), data, exerciseName });
  };

  return { addExerciseLog, isPending: mutation.isPending };
}
