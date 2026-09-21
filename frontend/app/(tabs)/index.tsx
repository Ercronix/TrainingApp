import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { TrainingSplit } from '@/types';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSplits } from '@/hooks/useSplits';
import SwipeableRow from '@/components/SwipeableRow';
import { useTheme } from '@/hooks/useTheme';

export default function SplitsScreen() {
  const router = useRouter();
  const { splits, isLoading, isRefetching, refetch, activateSplit, deleteSplit } = useSplits();
  const c = useTheme();

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
          color: c.danger,
          backgroundColor: c.dangerMuted,
          label: 'DELETE',
          onPress: () => handleDelete(item.id, item.name),
        },
      ]}
      leftActions={
        !item.isActive
          ? [
              {
                icon: 'flash-outline',
                color: c.accent,
                backgroundColor: c.accentMuted,
                label: 'ACTIVATE',
                onPress: () => handleActivate(item.id, item.name),
              },
            ]
          : undefined
      }
    >
      <TouchableOpacity
        className={`rounded-md px-5 py-5 flex-row items-center overflow-hidden relative ${
          item.isActive ? 'bg-elevated' : 'bg-surface'
        }`}
        onPress={() =>
          router.push({ pathname: '/workouts', params: { splitId: item.id.toString(), splitName: item.name, currentBlock: item.currentBlock?.toString() || '1' } })
        }
        activeOpacity={0.85}
      >
        {/* Active left stripe */}
        {item.isActive && (
          <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent rounded-l-md" />
        )}

        {/* Index number */}
        <Text className="text-subtle text-[32px] font-bold tracking-tighter mr-4 leading-9">
          {String(index + 1).padStart(2, '0')}
        </Text>

        {/* Name + meta */}
        <View className="flex-1">
          <Text className="text-primary text-lg font-bold tracking-tight mb-1">{item.name}</Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-muted text-[10px] tracking-widest">
              {item.workoutCount} {item.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
            </Text>
            {item.currentBlock && (
              <Text className="text-accent-text text-[9px] tracking-[2px]">BLOCK {item.currentBlock}/3</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-3">
          {item.isActive && (
            <View className="bg-accent px-2 py-1 rounded-sm">
              <Text className="text-accent-fg text-[9px] font-bold tracking-widest">ACTIVE</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={c.subtle} />
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">YOUR PROGRAM</Text>
        <Text className="text-primary text-[44px] font-bold leading-[46px] tracking-tighter">
          TRAINING{'\n'}SPLITS
        </Text>
      </View>

      <FlatList
        data={splits}
        renderItem={renderSplitItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />
        }
        ListEmptyComponent={
          <View className="items-center mt-20 gap-3">
            <Ionicons name="barbell-outline" size={48} color={c.subtle} />
            <Text className="text-subtle text-xl font-bold tracking-[2px]">NO SPLITS YET</Text>
            <Text className="text-dim text-sm">Create your first training split</Text>
          </View>
        }
      />

      {/* FAB */}
      <Link href="/create-split" asChild>
        <TouchableOpacity
          className="absolute right-6 bottom-20 w-14 h-14 rounded-md bg-accent justify-center items-center"
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
          activeOpacity={0.8}
        >
          <Text className="text-accent-fg text-3xl font-bold leading-8">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
