import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';
import { STEP_INCREMENT_KG, useStepSizeStore } from '@/store/stepSizeStore';
import { formatNumber } from '@/utils/logExercise';

function StepButton({ icon, onPress, label, disabled = false }: {
  icon: 'remove' | 'add'; onPress: () => void; label: string; disabled?: boolean;
}) {
  const c = useTheme();
  return (
    <Tactile
      variant="elevated"
      depth={3}
      className="w-11 h-10 rounded-sm justify-center items-center"
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={disabled ? c.subtle : c.accent} />
    </Tactile>
  );
}

function ValueInput({ value, onChange, placeholder, keyboardType, editable = true }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  keyboardType: 'decimal-pad' | 'number-pad'; editable?: boolean;
}) {
  const c = useTheme();
  return (
    // min-w-0: on web an <input> won't shrink below its default ~20ch width, overflowing the row
    <TextInput
      className="flex-1 min-w-0 h-11 px-1 text-primary text-xl font-mono-bold text-center"
      placeholder={placeholder}
      placeholderTextColor={c.elevated}
      value={value}
      editable={editable}
      onChangeText={onChange}
      keyboardType={keyboardType}
      keyboardAppearance={c.keyboardAppearance}
    />
  );
}

interface WeightStepperProps {
  value: string;
  placeholder: string;
  onChange: (weight: string) => void;
  onStep: (direction: 1 | -1) => void;
  /** Kg per tap, adjustable per library entry (not without one). */
  step: number;
  libraryExerciseId: string | undefined;
}

/** Weight input between -/+ step buttons, under a control for the step size. */
export function WeightStepper({ value, placeholder, onChange, onStep, step, libraryExerciseId }: WeightStepperProps) {
  const c = useTheme();
  return (
    <View className="flex-[1.3] bg-inset rounded-sm p-1 gap-1">
      <View className="flex-row items-center justify-center gap-1.5 pt-1">
        <Text className="text-muted text-[9px] tracking-[2px]">KG · STEP</Text>
        <TouchableOpacity
          onPress={() => libraryExerciseId && useStepSizeStore.getState().adjustStep(libraryExerciseId, -STEP_INCREMENT_KG)}
          disabled={!libraryExerciseId}
          accessibilityLabel="Decrease weight step"
          hitSlop={8}
        >
          <Ionicons name="remove-circle-outline" size={14} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-primary text-[10px] font-bold">{formatNumber(step)}</Text>
        <TouchableOpacity
          onPress={() => libraryExerciseId && useStepSizeStore.getState().adjustStep(libraryExerciseId, STEP_INCREMENT_KG)}
          disabled={!libraryExerciseId}
          accessibilityLabel="Increase weight step"
          hitSlop={8}
        >
          <Ionicons name="add-circle-outline" size={14} color={c.muted} />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center">
        <StepButton icon="remove" onPress={() => onStep(-1)} label={`Decrease weight by ${formatNumber(step)} kg`} />
        <ValueInput value={value} onChange={onChange} placeholder={placeholder} keyboardType="decimal-pad" />
        <StepButton icon="add" onPress={() => onStep(1)} label={`Increase weight by ${formatNumber(step)} kg`} />
      </View>
    </View>
  );
}

interface RepsStepperProps {
  value: string;
  placeholder: string;
  onChange: (reps: string) => void;
  onStep: (direction: 1 | -1) => void;
  /** 'reps' or 'sec' */
  unitShort: string;
  /** While the stopwatch runs, the value is its time and can't be edited. */
  disabled: boolean;
}

/** Reps (or seconds) input between -/+ 1 buttons. */
export function RepsStepper({ value, placeholder, onChange, onStep, unitShort, disabled }: RepsStepperProps) {
  return (
    <View className="flex-1 bg-inset rounded-sm p-1 gap-1">
      <Text className="text-muted text-[9px] tracking-[2px] text-center pt-1">{unitShort.toUpperCase()}</Text>
      <View className="flex-row items-center">
        <StepButton icon="remove" onPress={() => onStep(-1)} label={`Decrease ${unitShort}`} disabled={disabled} />
        <ValueInput value={value} onChange={onChange} placeholder={placeholder} keyboardType="number-pad" editable={!disabled} />
        <StepButton icon="add" onPress={() => onStep(1)} label={`Increase ${unitShort}`} disabled={disabled} />
      </View>
    </View>
  );
}
