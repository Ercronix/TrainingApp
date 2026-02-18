import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { splitsApi } from '@/services/api';
import { Alert } from 'react-native';
import { getErrorMessage } from '@/utils/errorHandler';

export function useSplits() {
  const queryClient = useQueryClient();

  // Get Splits
  const splitsQuery = useQuery({
    queryKey: ['splits'],
    queryFn: splitsApi.getAll,
  });

  // Create Split
  const createSplit = useMutation({
    mutationFn: splitsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['splits'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  // Activate Split
  const activateSplit = useMutation({
    mutationFn: splitsApi.activate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['splits'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  // Delete Split
  const deleteSplit = useMutation({
    mutationFn: splitsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['splits'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  return {
    splits: splitsQuery.data,
    isLoading: splitsQuery.isLoading,
    isRefetching: splitsQuery.isRefetching,
    refetch: splitsQuery.refetch,
    isCreating: createSplit.isPending,
    createSplit,
    activateSplit,
    deleteSplit,
  };
}