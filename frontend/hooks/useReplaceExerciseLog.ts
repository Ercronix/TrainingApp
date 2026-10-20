import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { MUTATION_KEYS, ReplaceExerciseLogVariables, trainingScope } from '@/services/queryClient';
import { useSetDraftStore } from '@/store/setDraftStore';
import { ExerciseLog, TrainingLog } from '@/types';
import type { AddExerciseLogDto } from './useAddExerciseLog';

export type ReplaceExerciseLogDto = Omit<AddExerciseLogDto, 'addToWorkout'>;

/**
 * Swaps a session's exercise for another one, for this session only. The row keeps its id and
 * place and starts over right away — also while offline, where the request is paused (and
 * persisted) until the connection returns.
 */
export function useReplaceExerciseLog(trainingLogId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation<ExerciseLog, unknown, ReplaceExerciseLogVariables & { exerciseName: string }, { previous?: TrainingLog }>({
    mutationKey: MUTATION_KEYS.replaceExerciseLog,
    scope: trainingScope(trainingLogId ?? ''),
    onMutate: async ({ exerciseLogId, data, exerciseName }) => {
      const queryKey = QUERY_KEYS.training(trainingLogId ?? '');
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrainingLog>(queryKey);
      if (previous) {
        const replace = (e: ExerciseLog): ExerciseLog => ({
          ...e,
          libraryExerciseId: data.libraryExerciseId ?? -1,
          exerciseName,
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
          equipment: null,
          previousSets: null,
          previousReps: null,
          previousWeight: null,
          previousSetLogs: null,
          bestWeight: null,
          bestOneRepMax: null,
        });
        queryClient.setQueryData<TrainingLog>(queryKey, {
          ...previous,
          exercises: previous.exercises.map((e) => (e.id === exerciseLogId ? replace(e) : e)),
        });
      }
      // Unsaved sets belonged to the old exercise
      useSetDraftStore.getState().clearDrafts([String(exerciseLogId)]);
      router.back();
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.training(trainingLogId ?? ''), context.previous);
      alert('Error', getErrorMessage(error));
    },
  });

  const replaceExerciseLog = (exerciseLogId: number, data: ReplaceExerciseLogDto, exerciseName: string) => {
    if (!trainingLogId) return;
    mutation.mutate({ trainingLogId: Number(trainingLogId), exerciseLogId, data, exerciseName });
  };

  return { replaceExerciseLog, isPending: mutation.isPending };
}
