import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TrainingSplit } from '@/types';

interface Props {
  visible: boolean;
  splits: TrainingSplit[];
  onSelect: (split: TrainingSplit) => void;
  onManage: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet for switching the active split. Picking one is the choice, so there's no confirm.
 * Colors come from the palette, not theme classes: on web a Modal renders in a portal outside
 * the root view that defines the theme's CSS variables (as ConfirmDialogHost works around too).
 */
export function SplitPicker({ visible, splits, onSelect, onManage, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const c = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} accessibilityLabel="Close split picker" />
      <View
        className="rounded-t-2xl px-4 pt-4"
        style={{ backgroundColor: c.surface, paddingBottom: 16 + insets.bottom, maxHeight: '70%' }}
      >
        <View className="w-10 h-1 rounded-full self-center mb-4" style={{ backgroundColor: c.elevated }} />
        <Text className="text-[10px] tracking-[4px] px-2 mb-3" style={{ color: c.muted }}>ACTIVE SPLIT</Text>
        <ScrollView>
          {splits.map((split) => (
            <TouchableOpacity
              key={split.id}
              className="flex-row items-center gap-3 px-3 py-4 rounded-md mb-1"
              style={split.isActive ? { backgroundColor: c.elevated } : undefined}
              onPress={() => onSelect(split)}
              accessibilityLabel={split.isActive ? `${split.name}, active` : `Make ${split.name} the active split`}
            >
              <Ionicons
                name={split.isActive ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={split.isActive ? c.accent : c.muted}
              />
              <View className="flex-1">
                <Text className="text-base font-bold tracking-tight" style={{ color: c.primary }}>{split.name}</Text>
                <Text className="text-[10px] tracking-widest" style={{ color: c.muted }}>
                  {split.workoutCount} {split.workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-4 mt-2 border-t"
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
