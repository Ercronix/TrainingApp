import { Pressable, Text, View } from 'react-native';
import { haptics } from '@/utils/haptics';

interface Member {
  id: number;
  name: string;
  done: number;
  total: number;
}

/**
 * Where the exercise is in its superset ("SUPERSET · 1 OF 2 · ROUND 2 OF 3") and its members,
 * each with its sets done; tapping another member switches to it.
 */
export function SupersetBar({ place, members, currentId, onSelect }: {
  place: string;
  members: Member[];
  currentId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <View className="mb-4 px-1 gap-2">
      <Text className="text-accent-text text-[10px] font-bold tracking-[3px]">{place.toUpperCase()}</Text>
      <View className="flex-row gap-2">
        {members.map((m) => {
          const current = m.id === currentId;
          return (
            <Pressable
              key={m.id}
              className={`flex-1 rounded-sm px-2.5 py-2 rim-sm ${current ? 'bg-accent-muted border-accent' : 'bg-surface border-edge'}`}
              onPress={() => {
                haptics.tap();
                onSelect(m.id);
              }}
              disabled={current}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              accessibilityLabel={`${m.name}, ${m.done} of ${m.total} sets${current ? '' : '. Switch to it'}`}
            >
              {({ pressed }) => (
                <View style={{ opacity: pressed ? 0.7 : 1 }}>
                  <Text className={`text-xs font-bold ${current ? 'text-accent-text' : 'text-primary'}`} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text className="text-muted text-[10px] font-mono">{m.done}/{m.total}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
