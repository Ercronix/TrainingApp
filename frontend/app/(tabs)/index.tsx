import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { TrainingSplit } from '@/types';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSplits } from '@/hooks/useSplits';

export default function SplitsScreen() {
  const router = useRouter();

  const { splits, isLoading, isRefetching, refetch, activateSplit } = useSplits();

  const handleActivate = (id: number) => {
    activateSplit.mutate(id);
  };

  const renderSplitItem = ({ item }: { item: TrainingSplit }) => (
    <View className="relative">
      <TouchableOpacity
        className={`bg-white rounded-xl p-4 mb-3 ${
          item.isActive ? 'border-2 border-blue-500' : 'border border-gray-200'
        }`}
        onPress={() => router.push({
          pathname: '/workouts',
          params: {
            splitId: item.id.toString(),
            splitName: item.name
          }
        })}
        onLongPress={() => {
          Alert.alert(
            'Activate Split',
            `Set "${item.name}" as active split?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Activate', onPress: () => handleActivate(item.id) }
            ]
          );
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {item.name}
            </Text>
          </View>
          {item.isActive && (
            <View className="bg-blue-500 px-3 py-1 rounded-full mr-2">
              <Text className="text-white text-xs font-bold">ACTIVE</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
        <Text className="text-sm text-gray-500">
          {item.workoutCount} {item.workoutCount === 1 ? 'workout' : 'workouts'}
        </Text>
      </TouchableOpacity>
    </View>
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

      {/* FAB */}
      <Link href="/create-split" asChild>
        <TouchableOpacity
          className="absolute right-6 bottom-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg"
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}