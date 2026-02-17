import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useWorkoutDetail(workoutId: string) {
  const workoutQuery = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const response = await api.get(`/workouts/${workoutId}`);
      return response.data;
    },
    enabled: !!workoutId,
  });

  return {
    workout: workoutQuery.data,
    isLoading: workoutQuery.isLoading,
  };
}