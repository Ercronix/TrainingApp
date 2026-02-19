import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { exercisesApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';

export interface EditExerciseForm {
  name: string;
  sets: string;
  reps: string;
  plannedWeight: string;
}

export function useEditExercise(workoutId: string, exerciseId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (form: EditExerciseForm) =>
      exercisesApi.update(Number(workoutId), Number(exerciseId), {
        name: form.name.trim(),
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        plannedWeight: form.plannedWeight ? parseFloat(form.plannedWeight) : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exercises(workoutId) });
      router.back();
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const save = (form: EditExerciseForm) => {
    if (!form.name.trim()) {
      alert('Error', 'Please enter an exercise name');
      return;
    }
    mutation.mutate(form);
  };

  return { save, isPending: mutation.isPending };
}