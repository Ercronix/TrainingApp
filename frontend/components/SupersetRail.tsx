import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SupersetPosition, supersetLabel } from '@/utils/supersets';

// The cards' bottom margin (mb-2), where the rail of a group's last row stops
const CARD_GAP = 8;

/**
 * Wraps a row of an exercise list: a row in a superset gets an accent rail on its left, which
 * joins up with the rails of the group's other rows, and the group's first row a label above
 * it ("SUPERSET", or "CIRCUIT · 3" from three on). Other rows are passed through as they are.
 */
export function SupersetRail({ position, children }: { position: SupersetPosition | null; children: ReactNode }) {
  if (!position) return <>{children}</>;
  const first = position.index === 0;
  const last = position.index === position.size - 1;
  const label = supersetLabel(position.size).toUpperCase();
  return (
    <View className="flex-row">
      <View className="w-4 items-start" style={{ paddingTop: first ? 4 : 0, paddingBottom: last ? CARD_GAP : 0 }}>
        <View
          className="flex-1 bg-accent"
          style={{
            width: 3,
            borderTopLeftRadius: first ? 2 : 0,
            borderTopRightRadius: first ? 2 : 0,
            borderBottomLeftRadius: last ? 2 : 0,
            borderBottomRightRadius: last ? 2 : 0,
          }}
        />
      </View>
      <View className="flex-1">
        {first && (
          <Text
            className="text-accent-text text-[9px] font-bold tracking-[3px] mb-1.5"
            accessibilityLabel={`${supersetLabel(position.size)} of ${position.size} exercises`}
          >
            {position.size > 2 ? `${label} · ${position.size}` : label}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}
