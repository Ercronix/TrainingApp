import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '@/hooks/useLibrary';
import { useTheme } from '@/hooks/useTheme';
import { LibraryExercise } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const { library, isLoading, isRefetching, refetch } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const c = useTheme();

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? library.filter((e) => e.name.toLowerCase().includes(query)) : library;
  }, [library, searchQuery]);

  const renderItem = ({ item }: { item: LibraryExercise }) => (
    <TouchableOpacity
      className="bg-surface rounded-md px-5 py-4 mb-2 flex-row items-center gap-3"
      onPress={() =>
        router.push({
          pathname: '/exercise-detail' as any,
          params: {
            libraryExerciseId: item.id.toString(), fromLibrary: '1',
            exerciseName: item.name, description: item.description || '', videoUrl: item.videoUrl || '',
          },
        })
      }
      activeOpacity={0.85}
    >
      <View className="flex-1">
        <Text className="text-primary text-[17px] font-bold tracking-tight mb-1">{item.name}</Text>
        <Text className="text-muted text-[9px] tracking-[2px]">
          {item.workoutCount} {item.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
          {item.repUnit === 'seconds' ? ' · TIMED' : ''}
          {item.lastTrainedAt ? ` · LAST ${new Date(item.lastTrainedAt).toLocaleDateString()}` : ''}
        </Text>
      </View>
      {!!item.videoUrl && <Ionicons name="play-circle-outline" size={18} color={c.muted} />}
      <Ionicons name="chevron-forward" size={18} color={c.subtle} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">YOUR EXERCISES</Text>
        <Text className="text-primary text-[36px] font-bold tracking-tighter leading-10">LIBRARY</Text>
        <Text className="text-muted text-xs mt-2">
          Notes, video and progress are shared by every workout that uses an exercise
        </Text>
      </View>

      {/* Search bar */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-surface rounded-md px-4 py-3">
          <Ionicons name="search" size={16} color={c.muted} />
          <TextInput
            className="flex-1 text-primary text-sm ml-3"
            placeholder="Search exercises..."
            placeholderTextColor={c.subtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={c.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name={searchQuery ? 'search-outline' : 'library-outline'} size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">
                {searchQuery ? 'NO RESULTS' : 'NO EXERCISES YET'}
              </Text>
              <Text className="text-dim text-sm">
                {searchQuery ? 'Try a different search' : 'Exercises you add to workouts appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
