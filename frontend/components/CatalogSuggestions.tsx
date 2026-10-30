import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CatalogExercise } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { searchCatalog } from '@/utils/muscles';
import { MuscleSummary } from '@/components/MusclePicker';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';

/**
 * Catalog exercises matching the typed name, with their drawings. Picking one takes over its name,
 * muscles and drawing, so the exercise counts towards weekly sets per muscle.
 */
export function CatalogSuggestions({
  catalog,
  query,
  onSelect,
  title = 'FROM THE CATALOG',
  requireAll = true,
  limit = 4,
  hideExactMatch = true,
}: {
  catalog: CatalogExercise[];
  query: string;
  onSelect: (entry: CatalogExercise) => void;
  title?: string;
  requireAll?: boolean;
  limit?: number;
  /** Shows nothing once the query is exactly a catalog exercise's name. */
  hideExactMatch?: boolean;
}) {
  const c = useTheme();
  if (query.trim().length < 2) return null;
  const normalized = query.trim().toLowerCase();
  const matches = searchCatalog(catalog, query, { limit, requireAll });
  // Nothing to suggest once the name is exactly a catalog exercise
  if (matches.length === 0 || (hideExactMatch && matches.some((m) => m.name.toLowerCase() === normalized))) return null;

  return (
    <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md mb-5 overflow-hidden">
      <Text className="text-muted text-[9px] tracking-[3px] px-4 pt-3 pb-1">{title}</Text>
      {matches.map((entry) => (
        <TouchableOpacity
          key={entry.id}
          className="flex-row items-center gap-3 px-4 py-3"
          onPress={() => onSelect(entry)}
          activeOpacity={0.7}
        >
          <View className="w-12 items-center">
            {entry.hasIllustration ? (
              <ExerciseIllustration catalogExerciseId={entry.id} width={44} height={44} />
            ) : (
              <Ionicons name="body-outline" size={16} color={c.accent} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-primary text-sm font-bold">{entry.name}</Text>
            <MuscleSummary muscles={entry.muscles} />
          </View>
          {!!entry.equipment && (
            <Text className="text-muted text-[9px] tracking-widest">{entry.equipment.toUpperCase()}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
