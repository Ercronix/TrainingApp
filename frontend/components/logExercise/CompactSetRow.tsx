import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { SetRow } from '@/store/setDraftStore';
import { Gain, RowDefaults } from '@/utils/logExercise';
import { GainBadge } from './GainBadge';
import { SetNumberBadge } from './SetNumberBadge';

/** Column labels above the compact rows. */
export function SetColumnHeader({ unitShort }: { unitShort: string }) {
  return (
    <View className="flex-row items-center pl-3 mb-2">
      <Text className="w-12 text-muted text-[9px] tracking-[2px]">SET</Text>
      <Text className="flex-1 text-muted text-[9px] tracking-[2px]">PREVIOUS</Text>
      <Text className="flex-1 text-muted text-[9px] tracking-[2px]">KG</Text>
      <Text className="flex-1 text-muted text-[9px] tracking-[2px]">{unitShort.toUpperCase()}</Text>
      <View className="w-14" />
    </View>
  );
}

interface CompactSetRowProps {
  row: SetRow;
  index: number;
  /** Set number, or W for a warm-up. */
  label: string;
  /** The set at this position last session, e.g. 80×8. */
  previous: string | null;
  gain: Gain | null;
  /** Pops the gain badge in: the set was just logged. */
  animateGain: boolean;
  invalid: boolean;
  /** Shown for empty values. */
  defaults: RowDefaults;
  unitShort: string;
  /** The stopwatch runs for this set: its time shows, and it can't be checked. */
  timing: boolean;
  elapsed: number;
  onEdit: () => void;
  onToggleDone: () => void;
}

/** A set not being edited: its values at a glance, tap to edit (and delete), check to log. */
export function CompactSetRow({
  row, index, label, previous, gain, animateGain, invalid, defaults, unitShort, timing, elapsed, onEdit, onToggleDone,
}: CompactSetRowProps) {
  const c = useTheme();
  return (
    <View
      className={`flex-row items-center h-16 rounded-md pl-3 rim ${row.done ? 'bg-surface-done' : 'bg-surface'} ${invalid ? 'border-danger' : row.done ? 'border-edge-done' : 'border-edge'}`}
    >
      <TouchableOpacity
        className="flex-1 h-full flex-row items-center"
        onPress={onEdit}
        accessibilityLabel={`Edit set ${index + 1}`}
      >
        <View className="w-12"><SetNumberBadge row={row} label={label} /></View>
        <View className="flex-1 gap-1">
          <Text className="text-muted text-xs font-mono">{previous ?? '—'}</Text>
          {gain && <GainBadge gain={gain} animate={animateGain} />}
        </View>
        <Text className={`flex-1 text-lg font-bold tracking-tight ${row.done ? 'text-primary' : 'text-muted'}`}>
          {row.weight || defaults.weight || 0}<Text className="text-muted text-xs font-normal"> kg</Text>
        </Text>
        <Text className={`flex-1 text-lg font-bold tracking-tight ${row.done ? 'text-primary' : 'text-muted'}`}>
          {timing ? elapsed : row.reps || defaults.reps || 0}
          <Text className="text-muted text-xs font-normal"> {unitShort}</Text>
          {row.rpe.trim() !== '' && <Text className="text-muted text-xs font-normal">  @{row.rpe}</Text>}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-14 h-14 justify-center items-center"
        onPress={onToggleDone}
        disabled={timing}
        accessibilityLabel={row.done ? `Mark set ${index + 1} as not done` : `Log set ${index + 1} as shown and start rest`}
      >
        <Ionicons
          name={row.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={30}
          color={row.done ? c.accent : c.muted}
        />
      </TouchableOpacity>
    </View>
  );
}
