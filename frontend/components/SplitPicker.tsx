import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TrainingSplit } from '@/types';

/** Window rect of the element that opened the picker, from `measureInWindow`. */
export interface PickerAnchor {
  y: number;
  height: number;
}

interface Props {
  visible: boolean;
  anchor: PickerAnchor | null;
  splits: TrainingSplit[];
  onSelect: (split: TrainingSplit) => void;
  onManage: () => void;
  onClose: () => void;
}

const GAP = 8;
// Below this much room under the anchor, the menu opens above it instead
const MIN_SPACE_BELOW = 240;

/**
 * Dropdown for switching the active split, anchored to the control that opened it. Picking one is
 * the choice, so there's no confirm. Colors come from the palette, not theme classes: on web a
 * Modal renders in a portal outside the root view that defines the theme's CSS variables (as
 * ConfirmDialogHost works around too).
 */
export function SplitPicker({ visible, anchor, splits, onSelect, onManage, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const c = useTheme();

  const anchorBottom = anchor ? anchor.y + anchor.height + GAP : insets.top + 80;
  const spaceBelow = windowHeight - anchorBottom - insets.bottom - 16;
  const openUp = anchor !== null && spaceBelow < MIN_SPACE_BELOW;
  const position = openUp
    ? { bottom: windowHeight - anchor.y + GAP, maxHeight: anchor.y - GAP - insets.top - 16 }
    : { top: anchorBottom, maxHeight: spaceBelow };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
        accessibilityLabel="Close split picker"
      />
      <View
        className="absolute rounded-xl p-2 border"
        style={{
          ...position,
          left: 16,
          right: 16,
          backgroundColor: c.surface,
          borderColor: c.elevated,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        <ScrollView>
          {splits.map((split) => (
            <TouchableOpacity
              key={split.id}
              className="flex-row items-center gap-3 px-3 py-3 rounded-md"
              style={split.isActive ? { backgroundColor: c.elevated } : undefined}
              onPress={() => onSelect(split)}
              accessibilityLabel={split.isActive ? `${split.name}, active` : `Make ${split.name} the active split`}
            >
              <View className="flex-1">
                <Text className="text-base font-bold tracking-tight" style={{ color: c.primary }} numberOfLines={1}>
                  {split.name}
                </Text>
                <Text className="text-[10px] tracking-widest" style={{ color: c.muted }}>
                  {split.workoutCount} {split.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
                </Text>
              </View>
              {split.isActive && <Ionicons name="checkmark" size={20} color={c.accent} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          className="flex-row items-center gap-3 px-3 py-3 mt-1 border-t"
          style={{ borderColor: c.elevated }}
          onPress={onManage}
        >
          <Ionicons name="settings-outline" size={16} color={c.accent} />
          <Text className="text-xs font-bold tracking-[2px]" style={{ color: c.primary }}>MANAGE SPLITS</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
