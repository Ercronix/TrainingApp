import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { TrainingSplit } from '@/types';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSplits } from '@/hooks/useSplits';
import SwipeableRow from '@/components/SwipeableRow';

export default function SplitsScreen() {
  const router = useRouter();
  const { splits, isLoading, isRefetching, refetch, activateSplit, deleteSplit } = useSplits();

  const handleActivate = (id: number, name: string) => {
    Alert.alert('Activate Split', `Set "${name}" as active split?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Activate', onPress: () => activateSplit.mutate(id) },
    ]);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Split', `Delete "${name}"? This will also delete all its workouts.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSplit.mutate(id) },
    ]);
  };

  const renderSplitItem = ({ item, index }: { item: TrainingSplit; index: number }) => (
    <SwipeableRow
      rightActions={[
        {
          icon: 'trash-outline',
          color: '#ff734a',
          backgroundColor: '#2a1410',
          label: 'DELETE',
          onPress: () => handleDelete(item.id, item.name),
        },
      ]}
      leftActions={
        !item.isActive
          ? [
              {
                icon: 'flash-outline',
                color: '#cafd00',
                backgroundColor: '#1a2200',
                label: 'ACTIVATE',
                onPress: () => handleActivate(item.id, item.name),
              },
            ]
          : undefined
      }
    >
      <TouchableOpacity
        className={`rounded-md px-5 py-5 flex-row items-center overflow-hidden relative ${
          item.isActive ? 'bg-[#1a1a1a]' : 'bg-[#131313]'
        }`}
        onPress={() =>
          router.push({ pathname: '/workouts', params: { splitId: item.id.toString(), splitName: item.name } })
        }
        activeOpacity={0.85}
      >
        {/* Active left stripe */}
        {item.isActive && (
          <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#cafd00] rounded-l-md" />
        )}

        {/* Index number */}
        <Text className="text-[#262626] text-[32px] font-bold tracking-tighter mr-4 leading-9">
          {String(index + 1).padStart(2, '0')}
        </Text>

        {/* Name + meta */}
        <View className="flex-1">
          <Text className="text-[#f5f5f5] text-lg font-bold tracking-tight mb-1">{item.name}</Text>
          <Text className="text-[#7a7a7a] text-[10px] tracking-widest">
            {item.workoutCount} {item.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-3">
          {item.isActive && (
            <View className="bg-[#cafd00] px-2 py-1 rounded-sm">
              <Text className="text-[#0e0e0e] text-[9px] font-bold tracking-widest">ACTIVE</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color="#262626" />
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">YOUR PROGRAM</Text>
        <Text className="text-[#f5f5f5] text-[44px] font-bold leading-[46px] tracking-tighter">
          TRAINING{'\n'}SPLITS
        </Text>
      </View>

      <FlatList
        data={splits}
        renderItem={renderSplitItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" />
        }
        ListEmptyComponent={
          <View className="items-center mt-20 gap-3">
            <Ionicons name="barbell-outline" size={48} color="#262626" />
            <Text className="text-[#262626] text-xl font-bold tracking-[2px]">NO SPLITS YET</Text>
            <Text className="text-[#3a3a3a] text-sm">Create your first training split</Text>
          </View>
        }
      />

      {/* FAB */}
      <Link href="/create-split" asChild>
        <TouchableOpacity
          className="absolute right-6 bottom-20 w-14 h-14 rounded-md bg-[#cafd00] justify-center items-center"
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
          activeOpacity={0.8}
        >
          <Text className="text-[#0e0e0e] text-3xl font-bold leading-8">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
