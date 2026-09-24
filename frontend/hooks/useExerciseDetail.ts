import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alert } from '@/utils/confirm';
import { exercisesApi, libraryApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getErrorMessage } from '@/utils/errorHandler';

type DetailUpdate = { name?: string; videoUrl?: string | null; description?: string | null };

// Video and notes belong to the library entry, so edits apply to every workout using it. Falls
// back to the workout exercise endpoint (which edits the same entry) for data cached before the
// library existed.
export function useExerciseDetail(workoutId: string, exerciseId: string, libraryExerciseId?: string) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: DetailUpdate): Promise<void> => {
      if (libraryExerciseId) await libraryApi.update(Number(libraryExerciseId), data);
      else await exercisesApi.update(Number(workoutId), Number(exerciseId), data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
      void queryClient.invalidateQueries({ queryKey: ['training'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.library });
      alert('Saved!');
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const saveVideo = (videoUrl: string, onDone: () => void) => {
    updateMutation.mutate(
      { videoUrl: videoUrl.trim() || null },
      { onSuccess: onDone }
    );
  };

  const saveDescription = (description: string, onDone: () => void) => {
    updateMutation.mutate(
      { description: description.trim() || null },
      { onSuccess: onDone }
    );
  };

  // Library only: renames the entry everywhere it is used
  const saveName = (name: string, onDone: () => void) => {
    if (!name.trim()) {
      alert('Error', 'Please enter an exercise name');
      return;
    }
    updateMutation.mutate({ name: name.trim() }, { onSuccess: onDone });
  };

  return {
    saveVideo,
    saveDescription,
    saveName,
    isPending: updateMutation.isPending,
  };
}
