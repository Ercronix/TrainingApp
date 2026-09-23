import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LibraryExercise } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const MAX_SUGGESTIONS = 5;

/** Finds the library entry with exactly this name, ignoring case and surrounding spaces. */
export function findLibraryMatch(library: LibraryExercise[], name: string): LibraryExercise | undefined {
  const normalized = name.trim().toLowerCase();
  return normalized ? library.find((e) => e.name.toLowerCase() === normalized) : undefined;
}

/**
 * Library entries matching the typed exercise name. Picking one reuses the entry, so the
 * exercise shares its history, notes and video with every other workout using it.
 */
export function LibrarySuggestions({
  library,
  query,
  onSelect,
}: {
  library: LibraryExercise[];
  query: string;
  onSelect: (entry: LibraryExercise) => void;
}) {
  const c = useTheme();
  const normalized = query.trim().toLowerCase();
  if (!normalized || findLibraryMatch(library, query)) return null;

  const matches = library
    .filter((e) => e.name.toLowerCase().includes(normalized))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(normalized)) - Number(!b.name.toLowerCase().startsWith(normalized)))
    .slice(0, MAX_SUGGESTIONS);
  if (matches.length === 0) return null;

  return (
    <View className="bg-surface rounded mb-5 overflow-hidden">
      <Text className="text-muted text-[9px] tracking-[3px] px-4 pt-3 pb-1">FROM YOUR LIBRARY</Text>
      {matches.map((entry) => (
        <TouchableOpacity
          key={entry.id}
          className="flex-row items-center gap-3 px-4 py-3"
          onPress={() => onSelect(entry)}
          activeOpacity={0.7}
        >
          <Ionicons name="library-outline" size={16} color={c.accent} />
          <Text className="flex-1 text-primary text-sm font-bold">{entry.name}</Text>
          {entry.workoutCount > 0 && (
            <Text className="text-muted text-[10px] tracking-widest">
              {entry.workoutCount} {entry.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
