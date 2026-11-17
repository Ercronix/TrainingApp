import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditSplit } from '@/hooks/useEditSplit';
import { useSplits } from '@/hooks/useSplits';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { UpdateSplitRequest } from '@/types';
import { confirm } from '@/utils/confirm';
import { MESOCYCLE_LENGTHS, mesocycleWeek, startDateForWeek } from '@/utils/mesocycle';
import { localDay } from '@/utils/stretch';

import { Tactile } from '@/components/Tactile';

function Choice({ label, sub, selected, disabled, onPress }: {
  label: string; sub?: string; selected: boolean; disabled: boolean; onPress: () => void;
}) {
  return (
    <Tactile
      variant={selected ? 'accent' : 'surface'}
      depth={3}
      className="py-3 rounded items-center"
      containerClassName="flex-1"
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ selected }}
    >
      <Text className={`text-sm font-bold tracking-[1px] ${selected ? 'text-accent-fg' : 'text-muted'}`}>{label}</Text>
      {sub && (
        <Text className={`text-[8px] tracking-[1px] mt-1 ${selected ? 'text-accent-fg' : 'text-subtle'}`}>{sub}</Text>
      )}
    </Tactile>
  );
}

export default function EditSplitModal() {
  const { splitId, currentName, currentBlock } = useLocalSearchParams<{ splitId: string; currentName: string; currentBlock: string }>();
  const router = useRouter();
  const [name, setName] = useState(currentName || '');
  const [block, setBlock] = useState<number>(parseInt(currentBlock || '1') || 1);
  const { save, restartMesocycle, isPending } = useEditSplit(splitId);
  const { splits } = useSplits();
  const c = useTheme();

  // The saved mesocycle (from the cached splits)
  const split = splits?.find((s) => String(s.id) === splitId);
  const savedWeeks = split?.mesocycleWeeks ?? null;
  const savedStart = split?.mesocycleStartDate ?? null;
  const today = localDay();
  const [weeks, setWeeks] = useState<number | null>(savedWeeks);
  // Only set when the user picks the current week; otherwise it follows the saved start
  const [pickedWeek, setPickedWeek] = useState<number | null>(null);
  const derivedWeek = mesocycleWeek(weeks, savedStart, today)?.week ?? 1;
  const currentWeek = weeks ? Math.min(pickedWeek ?? derivedWeek, weeks) : 1;
  const lengths = [...new Set([...MESOCYCLE_LENGTHS, ...(savedWeeks ? [savedWeeks] : [])])].sort((a, b) => a - b);

  const onSave = () => {
    const changes: Omit<UpdateSplitRequest, 'name'> = { currentBlock: block };
    if (weeks == null) {
      if (savedWeeks != null) changes.mesocycleWeeks = 0;
    } else {
      changes.mesocycleWeeks = weeks;
      if (pickedWeek != null || !savedStart) changes.mesocycleStartDate = startDateForWeek(currentWeek, today, savedStart);
    }
    save(name, changes);
  };

  const onRestart = () =>
    confirm('Restart Cycle', 'Start the mesocycle over, with today as the first day of week 1?', restartMesocycle, 'Restart');

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">EDIT SPLIT</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingWrapper>
      <View className="flex-1 px-6 pb-10">
        <Text className="text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
          EDIT{'\n'}SPLIT
        </Text>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">SPLIT NAME</Text>
        <TextInput
          className="bg-surface rim-sm border-edge rounded px-4 py-4 text-primary text-xl font-bold tracking-tight mb-6"
          value={name}
          onChangeText={setName}
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">TRAINING BLOCK</Text>
        <View className="flex-row gap-3 mb-6">
          {[1, 2, 3].map((b) => (
            <Choice
              key={b}
              label={String(b)}
              sub={b === 1 ? 'HYPERTROPHY' : b === 2 ? 'STRENGTH' : 'POWER'}
              selected={block === b}
              disabled={isPending}
              onPress={() => setBlock(b)}
            />
          ))}
        </View>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">MESOCYCLE · WEEKS</Text>
        <View className="flex-row gap-2 mb-2">
          <Choice label="OFF" selected={weeks == null} disabled={isPending} onPress={() => setWeeks(null)} />
          {lengths.map((w) => (
            <Choice key={w} label={String(w)} selected={weeks === w} disabled={isPending} onPress={() => setWeeks(w)} />
          ))}
        </View>
        <Text className="text-muted text-xs leading-4 mb-6">
          {weeks
            ? 'The last week is a deload: sessions start with fewer sets at a lighter weight, and stay out of your progress trends. After it, the next cycle begins on its own.'
            : 'Plan your training in cycles of a few weeks, ending with a lighter deload week.'}
        </Text>

        {weeks != null && (
          <>
            <Text className="text-muted text-[9px] tracking-[3px] mb-2">THIS WEEK IS</Text>
            <View className="flex-row gap-1.5 mb-2">
              {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                <Choice
                  key={w}
                  label={w === weeks ? 'DL' : String(w)}
                  selected={currentWeek === w}
                  disabled={isPending}
                  onPress={() => setPickedWeek(w)}
                />
              ))}
            </View>
            <Text className="text-muted text-xs mb-4">
              {currentWeek === weeks ? 'The deload week' : `Week ${currentWeek} of ${weeks}`}
            </Text>
            {savedWeeks != null && (
              <TouchableOpacity
                className="flex-row items-center gap-2 self-start py-2 mb-4"
                onPress={onRestart}
                disabled={isPending}
                accessibilityLabel="Restart the mesocycle from today"
              >
                <Ionicons name="refresh" size={16} color={c.accent} />
                <Text className="text-accent-text text-xs font-bold tracking-[2px]">RESTART CYCLE TODAY</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Tactile
          className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          containerClassName="mt-2"
          onPress={onSave}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </Text>
        </Tactile>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
