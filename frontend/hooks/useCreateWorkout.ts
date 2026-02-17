import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "expo-router";
import {workoutsApi} from "@/services/api";
import {Alert} from "react-native";
import {CreateWorkoutDto, WorkoutFormData} from "@/types/workout";
import {getErrorMessage} from "@/utils/errorHandler";

export function useCreateWorkout(splitId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (data: CreateWorkoutDto) =>
      workoutsApi.create(Number(splitId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
      router.back();
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const createWorkout = (formData: WorkoutFormData) => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    mutation.mutate({
      name: formData.name.trim(),
      sets: formData.sets ? parseInt(formData.sets) : null,
      reps: formData.reps ? parseInt(formData.reps) : null,
      plannedWeight: formData.weight ? parseFloat(formData.weight) : null,
    });
  };

  return { createWorkout, isPending: mutation.isPending };
}