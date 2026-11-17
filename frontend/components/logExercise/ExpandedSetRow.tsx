import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';
import { PlateCalculator } from '@/components/PlateCalculator';
import { SetRow } from '@/store/setDraftStore';
import { Gain, RowDefaults, textOf } from '@/utils/logExercise';
import { GainBadge } from './GainBadge';
import { SetNumberBadge } from './SetNumberBadge';
import { RepsStepper, WeightStepper } from './Steppers';
import { RpePicker } from './RpePicker';

interface ExpandedSetRowProps {
  row: SetRow;
  index: number;
  /** Set number, or W for a warm-up. */
  label: string;
  /** The set at this position last session, e.g. 80×8. */
  previous: string | null;
  gain: Gain | null;
  invalid: boolean;
  /** Placeholders and stepper starts for empty values. */
  defaults: RowDefaults;
  unitShort: string;
  isTimed: boolean;
  showPlates: boolean;
  /** Weight stepper step in kg, and the library entry it's kept for. */
  step: number;
  libraryExerciseId: string | undefined;
  /** Removing the only set is not allowed. */
  canRemove: boolean;
  /** Which set the stopwatch runs for, if any; its time shows in place of the reps. */
  timing: 'this' | 'other' | null;
  elapsed: number;
  onChange: (patch: Partial<SetRow>) => void;
  onStepWeight: (direction: 1 | -1) => void;
  onStepReps: (direction: 1 | -1) => void;
  onToggleWarmup: () => void;
  onRemove: () => void;
  onToggleTiming: () => void;
  onToggleDone: () => void;
}

/** The set being edited, opened up in place in the list. */
export function ExpandedSetRow(props: ExpandedSetRowProps) {
  const {
    row, index, label, previous, gain, invalid, defaults, unitShort, showPlates, step, libraryExerciseId, canRemove,
    timing, elapsed, onChange, onStepWeight, onStepReps, onToggleWarmup, onRemove,
  } = props;
  const c = useTheme();
  const rowTiming = timing === 'this';
  return (
    <View className={`bg-surface rounded-md p-3 mb-2 gap-4 rim ${invalid ? 'border-danger' : 'border-accent'}`}>
      <View className="flex-row items-center gap-3">
        <SetNumberBadge row={row} label={label} />
        <Text className="flex-1 text-primary text-base font-bold tracking-tight" numberOfLines={1}>
          {row.warmup ? 'Warm-up' : `Set ${label}`}
          {previous != null && <Text className="text-muted text-xs font-normal">  last {previous}</Text>}
        </Text>
        {gain && <GainBadge gain={gain} animate={false} />}
        <Tactile
          variant={row.warmup ? 'accent' : 'elevated'}
          depth={3}
          className="rounded-sm px-3 py-1.5"
          onPress={onToggleWarmup}
          accessibilityLabel={row.warmup ? 'Warm-up set, tap to make it a working set' : 'Working set, tap to make it a warm-up'}
        >
          <Text className={`text-[10px] font-bold tracking-[2px] ${row.warmup ? 'text-accent-fg' : 'text-muted'}`}>WARM-UP</Text>
        </Tactile>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-danger-muted justify-center items-center"
          style={!canRemove ? { opacity: 0.4 } : undefined}
          onPress={onRemove}
          disabled={!canRemove}
          accessibilityLabel={`Remove set ${index + 1}`}
        >
          <Ionicons name="trash-outline" size={16} color={c.danger} />
        </TouchableOpacity>
      </View>

      {/* Weight and reps side by side */}
      <View className="flex-row gap-2">
        <WeightStepper
          value={row.weight}
          placeholder={textOf(defaults.weight) || '0'}
          onChange={(weight) => onChange({ weight })}
          onStep={onStepWeight}
          step={step}
          libraryExerciseId={libraryExerciseId}
        />
        <RepsStepper
          value={rowTiming ? String(elapsed) : row.reps}
          placeholder={textOf(defaults.reps) || '0'}
          onChange={(reps) => onChange({ reps })}
          onStep={onStepReps}
          unitShort={unitShort}
          disabled={rowTiming}
        />
      </View>

      <RpePicker value={row.rpe} onChange={(rpe) => onChange({ rpe })} />
      {invalid && (
        <Text className="text-danger text-[11px]">Check the values; this set isn&apos;t saved yet.</Text>
      )}

      {showPlates && <PlateCalculator weight={row.weight || textOf(defaults.weight)} />}

      <SetAction {...props} />
    </View>
  );
}

/** The row's main button: start or stop the stopwatch of a timed set, else log or undo it. */
function SetAction({ row, index, isTimed, timing, onToggleTiming, onToggleDone }: ExpandedSetRowProps) {
  const c = useTheme();
  const rowTiming = timing === 'this';
  if (isTimed && !row.done) {
    return (
      <Tactile
        className="rounded-md py-4 flex-row items-center justify-center gap-2"
        style={timing === 'other' ? { opacity: 0.5 } : undefined}
        onPress={onToggleTiming}
        haptic={false}
        disabled={timing === 'other'}
        accessibilityLabel={rowTiming ? `Stop timing set ${index + 1}` : `Start timing set ${index + 1}`}
        activeOpacity={0.85}
      >
        <Ionicons name={rowTiming ? 'stop' : 'play'} size={18} color={c.accentFg} />
        <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
          {rowTiming ? 'STOP & LOG SET' : 'START TIMER'}
        </Text>
      </Tactile>
    );
  }
  if (row.done) {
    return (
      <Tactile
        variant="elevated"
        className="rounded-md py-4 flex-row items-center justify-center gap-2"
        onPress={onToggleDone}
        haptic={false}
      >
        <Ionicons name="arrow-undo" size={18} color={c.muted} />
        <Text className="text-muted text-sm font-bold tracking-[2px]">UNDO SET</Text>
      </Tactile>
    );
  }
  return (
    <Tactile
      className="rounded-md py-4 flex-row items-center justify-center gap-2"
      onPress={onToggleDone}
      haptic={false}
      activeOpacity={0.85}
    >
      <Ionicons name="checkmark" size={18} color={c.accentFg} />
      <Text className="text-accent-fg text-sm font-bold tracking-[2px]">LOG SET</Text>
    </Tactile>
  );
}
