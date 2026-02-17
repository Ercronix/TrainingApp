import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { splitsApi } from '@/services/api';
import { Alert } from 'react-native';

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
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      Alert.alert('Success', 'Split created!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to create split');
    },
  });

  // Activate Split
  const activateSplit = useMutation({
    mutationFn: splitsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      Alert.alert('Success', 'Split activated!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to activate split');
    },
  });

  // Delete Split
  const deleteSplit = useMutation({
    mutationFn: splitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      Alert.alert('Success', 'Split deleted!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to delete split');
    },
  });

  return {
    splits: splitsQuery.data,
    isLoading: splitsQuery.isLoading,
    isRefetching: splitsQuery.isRefetching,
    refetch: splitsQuery.refetch,
    createSplit,
    activateSplit,
    deleteSplit,
  };
}