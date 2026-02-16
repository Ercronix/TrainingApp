import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { splitsApi } from '@/services/api';
import { TrainingSplit } from '@/types';

export default function SplitsScreen() {
  const queryClient = useQueryClient();

  const { data: splits, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['splits'],
    queryFn: splitsApi.getAll,
  });

  const activateMutation = useMutation({
    mutationFn: splitsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      Alert.alert('Success', 'Split activated!');
    },
  });

  const handleActivate = (id: number) => {
    activateMutation.mutate(id);
  };

  const renderSplitItem = ({ item }: { item: TrainingSplit }) => (
    <TouchableOpacity
      className={`bg-white rounded-xl p-4 mb-3 ${
        item.isActive ? 'border-2 border-blue-500' : 'border border-gray-200'
      }`}
      onPress={() => handleActivate(item.id)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {item.name}
        </Text>
        {item.isActive && (
          <View className="bg-blue-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">ACTIVE</Text>
          </View>
        )}
      </View>
      <Text className="text-sm text-gray-500">
        {item.workoutCount} {item.workoutCount === 1 ? 'workout' : 'workouts'}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">Loading splits...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-gray-800">
          Training Splits
        </Text>
      </View>

      {/* Splits List */}
      <FlatList
        data={splits}
        renderItem={renderSplitItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-xl text-gray-400 mb-2">No splits yet</Text>
            <Text className="text-sm text-gray-400">
              Create your first training split!
            </Text>
          </View>
        }
      />

      {/* FAB - Create Button */}
      <TouchableOpacity
        className="absolute right-6 bottom-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg"
        onPress={() => Alert.alert('Coming soon', 'Create split feature!')}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}