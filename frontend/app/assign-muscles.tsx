import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '@/hooks/useLibrary';
import { useCatalog } from '@/hooks/useCatalog';
import { useTheme } from '@/hooks/useTheme';
import { searchCatalog } from '@/utils/muscles';
import { MuscleSummary } from '@/components/MusclePicker';
import { CatalogExercise, LibraryExercise } from '@/types';

const MATCHES_PER_EXERCISE = 3;

/**
 * Library entries without muscles, each with the closest catalog exercises. Picking one copies
 * its muscles; anything else can be set by hand on the exercise screen.
 */
export default function AssignMusclesScreen() {
  const router = useRouter();
  const { library, isLoading, updateEntry } = useLibrary();
  const { catalog, isLoading: catalogLoading } = useCatalog();
  const insets = useSafeAreaInsets();
  const c = useTheme();
  // Entries whose muscles were just saved stay hidden while the library refetches
  const [done, setDone] = useState<Set<number>>(new Set());

  const untagged = useMemo(
    () => library.filter((e) => !e.muscles?.length && !done.has(e.id)),
    [library, done],
  );

  // Matching tokenizes the whole catalog, so it runs once per entry rather than on every render
  const matchesById = useMemo(
    () => new Map(untagged.map((e) => [
      e.id, searchCatalog(catalog, e.name, { limit: MATCHES_PER_EXERCISE, requireAll: false }),
    ])),
    [catalog, untagged],
  );

  const apply = (entry: LibraryExercise, match: CatalogExercise) => {
    updateEntry.mutate(
      { id: entry.id, data: { muscles: match.muscles } },
      { onSuccess: () => setDone((prev) => new Set(prev).add(entry.id)) },
    );
  };

  const openEntry = (entry: LibraryExercise) =>
    router.push({
      pathname: '/exercise-detail' as any,
      params: {
        libraryExerciseId: entry.id.toString(), fromLibrary: '1',
        exerciseName: entry.name, description: entry.description || '', videoUrl: entry.videoUrl || '',
      },
    });

  const renderItem = ({ item }: { item: LibraryExercise }) => {
    const matches = matchesById.get(item.id) ?? [];
    return (
      <View className="bg-surface rounded-md mb-2 overflow-hidden">
        <TouchableOpacity className="flex-row items-center px-5 pt-4 pb-2" onPress={() => openEntry(item)} activeOpacity={0.85}>
          <Text className="flex-1 text-primary text-[17px] font-bold tracking-tight">{item.name}</Text>
          <Text className="text-muted text-[9px] tracking-[2px] mr-1">SET BY HAND</Text>
          <Ionicons name="chevron-forward" size={16} color={c.subtle} />
        </TouchableOpacity>
        {matches.length === 0 ? (
          <Text className="text-muted text-xs px-5 pb-4">No similar catalog exercise</Text>
        ) : (
          matches.map((match) => (
            <TouchableOpacity
              key={match.id}
              className={`flex-row items-center gap-3 px-5 py-2.5 ${updateEntry.isPending ? 'opacity-50' : ''}`}
              onPress={() => apply(item, match)}
              disabled={updateEntry.isPending}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={c.accent} />
              <View className="flex-1">
                <Text className="text-primary text-sm">{match.name}</Text>
                <MuscleSummary muscles={match.muscles} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View className="h-2" />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-base">
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">LIBRARY</Text>
        <Text className="text-primary text-[36px] font-bold tracking-tighter leading-10">ASSIGN{'\n'}MUSCLES</Text>
        <Text className="text-muted text-xs mt-2">
          Tap the closest catalog exercise to copy its muscles, or open an exercise to set them by hand
        </Text>
      </View>

      {isLoading || catalogLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={untagged}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 + insets.bottom }}
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name="body-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">ALL ASSIGNED</Text>
              <Text className="text-dim text-sm">Every library exercise has muscles</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
