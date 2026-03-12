import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { TrainingSplit } from '@/types';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSplits } from '@/hooks/useSplits';

export default function SplitsScreen() {
  const router = useRouter();
  const { splits, isLoading, isRefetching, refetch, activateSplit, deleteSplit } = useSplits();

  const handleActivate = (id: number, name: string) => {
    Alert.alert(
      'Activate Split',
      `Set "${name}" as active split?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: () => activateSplit.mutate(id) }
      ]
    );
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Split',
      `Delete "${name}"? This will also delete all its workouts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSplit.mutate(id)
        }
      ]
    );
  };

  const renderSplitItem = ({ item }: { item: TrainingSplit }) => (
    <View className="relative">
      <TouchableOpacity
        className={`bg-slate-900 rounded-xl p-4 mb-3 ${
          item.isActive ? 'border-2 border-blue-500' : 'border border-slate-800'
        }`}
        onPress={() => router.push({
          pathname: '/workouts',
          params: {
            splitId: item.id.toString(),
            splitName: item.name
          }
        })}
        onLongPress={() => handleActivate(item.id, item.name)}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-slate-100">
              {item.name}
            </Text>
          </View>

          {item.isActive && (
            <View className="bg-blue-600 px-3 py-1 rounded-full mr-2">
              <Text className="text-white text-xs font-bold">ACTIVE</Text>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id, item.name);
            }}
            className="p-1 mr-2"
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>

          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </View>

        <Text className="text-sm text-slate-400">
          {item.workoutCount} {item.workoutCount === 1 ? 'workout' : 'workouts'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <Text className="text-slate-400">Loading splits...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-slate-100">Training Splits</Text>
      </View>

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
            <Text className="text-xl text-slate-500 mb-2">No splits yet</Text>
            <Text className="text-sm text-slate-500">
              Create your first training split!
            </Text>
          </View>
        }
      />

      <Link href="/create-split" asChild>
        <TouchableOpacity className="absolute right-6 bottom-6 w-14 h-14 bg-blue-600 rounded-full justify-center items-center shadow-lg">
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
