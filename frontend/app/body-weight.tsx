import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { TrendChart, TrendPoint } from '@/components/charts/TrendChart';
import { ActionCard, ActionMenu } from '@/components/ActionMenu';
import { Tactile } from '@/components/Tactile';
import { alert, confirm } from '@/utils/confirm';
import { haptics } from '@/utils/haptics';
import { addDays, localDay } from '@/utils/stretch';
import { formatSigned } from '@/utils/stats';
import {
  changeOver, dayNumber, dayTime, formatWeight, movingAverage, parseWeight, stepWeight,
} from '@/utils/bodyWeight';
import { BodyWeightEntry } from '@/types';

const AVERAGE_DAYS = 7;
const LIST_COLLAPSED = 30;
// Where the stepper starts without any weight logged yet
const FALLBACK_WEIGHT = 75;

const RANGES = [
  { id: '1m', label: '1M', days: 31 },
  { id: '3m', label: '3M', days: 91 },
  { id: '1y', label: '1Y', days: 365 },
  { id: 'all', label: 'ALL', days: Infinity },
] as const;

const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const longDate = (day: string) =>
  new Date(dayTime(day)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function dayLabel(day: string, today: string): string {
  const diff = dayNumber(today) - dayNumber(day);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return new Date(dayTime(day)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

/** Log the day's body weight, see its trend with a 7-day average, and edit or delete entries. */
export default function BodyWeightScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { entries, isLoading, isRefetching, refetch, logWeight, deleteEntry } = useBodyWeight();
  const today = localDay();

  // The day being logged; text and note stay null until edited, showing the day's entry meanwhile
  const [date, setDate] = useState(today);
  const [text, setText] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('3m');
  const [showAll, setShowAll] = useState(false);

  const latest = entries[entries.length - 1];
  const existing = entries.find((e) => e.date === date);
  const shownText = text ?? (existing ? formatWeight(existing.weight) : latest ? formatWeight(latest.weight) : '');
  const shownNote = note ?? existing?.note ?? '';

  const average = useMemo(() => movingAverage(entries, AVERAGE_DAYS), [entries]);
  const averageByDate = useMemo(() => new Map(average.map((a) => [a.date, a.value])), [average]);

  const selectDate = (day: string) => {
    setDate(day);
    setText(null);
    setNote(null);
  };

  const step = (delta: number) => {
    const from = parseWeight(shownText) ?? latest?.weight ?? FALLBACK_WEIGHT;
    setText(formatWeight(stepWeight(Number(from), delta)));
  };

  const save = () => {
    const weight = parseWeight(shownText);
    if (weight == null) {
      alert('Invalid weight', 'Enter your body weight in kg, e.g. 80.5');
      return;
    }
    haptics.check();
    Keyboard.dismiss();
    logWeight(date, weight, shownNote);
    setText(null);
    setNote(null);
  };

  const edit = (entry: BodyWeightEntry) => {
    selectDate(entry.date);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = (entry: BodyWeightEntry) => {
    confirm('Delete Entry', `Delete ${formatWeight(entry.weight)} kg on ${longDate(entry.date)}?`, () => {
      deleteEntry(entry.date);
      if (entry.date === date) selectDate(date);
    }, 'Delete');
  };

  // Chart
  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const visible = entries.filter((e) => dayNumber(today) - dayNumber(e.date) <= rangeDays);
  const points: TrendPoint[] = visible.map((e) => ({ x: dayTime(e.date), y: Number(e.weight) }));
  const overlay: TrendPoint[] = visible.map((e) => ({ x: dayTime(e.date), y: averageByDate.get(e.date) ?? Number(e.weight) }));

  const latestAverage = average[average.length - 1]?.value;
  const change30 = changeOver(entries, 30);
  const newestFirst = [...entries].reverse();
  const listed = showAll ? newestFirst : newestFirst.slice(0, LIST_COLLAPSED);

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">TRACKING</Text>
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9">BODY WEIGHT</Text>
        <Text className="text-muted text-[10px] tracking-[2px] mt-1">
          {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          {latest ? ` · LATEST ${formatWeight(latest.weight)} KG` : ''}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
        >
          {/* Log */}
          <View className="bg-surface rim border-edge rounded-md p-5 mb-2">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => selectDate(localDay(addDays(new Date(dayTime(date)), -1)))}
                hitSlop={8}
                accessibilityLabel="Previous day"
                className="w-9 h-9 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color={c.muted} />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-accent-text text-[10px] tracking-[4px]">{dayLabel(date, today)}</Text>
                <Text className="text-muted text-[10px] mt-0.5">{existing ? 'logged · saving replaces it' : 'not logged yet'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => selectDate(localDay(addDays(new Date(dayTime(date)), 1)))}
                disabled={date >= today}
                hitSlop={8}
                accessibilityLabel="Next day"
                className={`w-9 h-9 items-center justify-center ${date >= today ? 'opacity-30' : ''}`}
              >
                <Ionicons name="chevron-forward" size={20} color={c.muted} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-3 mb-3">
              <StepButton icon="remove" label="Decrease by 0.1 kg" onPress={() => step(-0.1)} />
              <View className="flex-1 flex-row items-baseline justify-center bg-inset rounded-sm py-2">
                <TextInput
                  value={shownText}
                  onChangeText={setText}
                  placeholder="0.0"
                  placeholderTextColor={c.subtle}
                  keyboardType="decimal-pad"
                  keyboardAppearance={c.keyboardAppearance}
                  selectTextOnFocus
                  maxLength={6}
                  accessibilityLabel="Body weight in kg"
                  className="text-primary text-[36px] font-mono-bold tracking-tight text-center min-w-[110px]"
                  onSubmitEditing={save}
                />
                <Text className="text-muted text-sm font-bold ml-1">kg</Text>
              </View>
              <StepButton icon="add" label="Increase by 0.1 kg" onPress={() => step(0.1)} />
            </View>

            <TextInput
              value={shownNote}
              onChangeText={setNote}
              placeholder="Note (optional)"
              placeholderTextColor={c.subtle}
              keyboardAppearance={c.keyboardAppearance}
              maxLength={500}
              className="bg-inset rounded-sm px-3 py-2.5 text-primary text-sm mb-4"
            />

            <Tactile
              className="rounded-md py-4 flex-row items-center justify-center gap-2"
              onPress={save}
              haptic={false}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color={c.accentFg} />
              <Text className="text-accent-fg text-sm font-bold tracking-[2px]">{existing ? 'UPDATE' : 'LOG WEIGHT'}</Text>
            </Tactile>
          </View>

          {isLoading ? (
            <View className="bg-surface rim border-edge rounded-md p-5 mb-2 items-center py-6">
              <Text className="text-muted text-[10px] tracking-[3px]">LOADING...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View className="items-center mt-10 gap-3 px-6">
              <Ionicons name="scale-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO ENTRIES YET</Text>
              <Text className="text-dim text-sm text-center">
                Log your weight above. With entries, exercise stats also show your strength relative to body weight.
              </Text>
            </View>
          ) : (
            <>
              {/* Trend */}
              <View className="bg-surface rim border-edge rounded-md p-5 mb-2">
                <Text className="text-muted text-[9px] tracking-[3px] mb-3">TREND</Text>
                {points.length === 0 ? (
                  <Text className="text-muted text-xs text-center py-10">No entries in this range</Text>
                ) : (
                  <TrendChart
                    points={points}
                    overlay={overlay}
                    markBest={false}
                    formatValue={(v) => `${formatWeight(v)} kg`}
                    formatX={shortDate}
                    describe={(i) => `${AVERAGE_DAYS}-DAY AVG ${formatWeight(Math.round(overlay[i].y * 10) / 10)} KG`}
                  />
                )}
                <View className="flex-row justify-between items-center mt-3">
                  <Text className="text-muted text-[10px]">Bold line: {AVERAGE_DAYS}-day average</Text>
                  <View className="flex-row gap-1">
                    {RANGES.map((r) => (
                      <Tactile
                        key={r.id}
                        variant={r.id === range ? 'accent' : 'elevated'}
                        depth={3}
                        className="px-2 py-1 rounded-sm"
                        onPress={() => setRange(r.id)}
                        accessibilityState={{ selected: r.id === range }}
                      >
                        <Text className={`text-[10px] font-bold tracking-widest ${r.id === range ? 'text-accent-fg' : 'text-muted'}`}>
                          {r.label}
                        </Text>
                      </Tactile>
                    ))}
                  </View>
                </View>
              </View>

              {/* Numbers */}
              <View className="bg-surface rim border-edge rounded-md p-5 mb-2 flex-row">
                <Stat value={latest ? `${formatWeight(latest.weight)} kg` : '—'} label="LATEST" accent />
                <Stat
                  value={latestAverage != null ? `${formatWeight(Math.round(latestAverage * 10) / 10)} kg` : '—'}
                  label={`${AVERAGE_DAYS}-DAY AVG`}
                />
                <Stat value={change30 != null ? `${formatSigned(change30, 1)} kg` : '—'} label="30-DAY CHANGE" />
              </View>

              {/* Entries */}
              <Text className="text-muted text-[9px] tracking-[3px] mt-4 mb-2 px-1">ENTRIES</Text>
              {listed.map((entry, i) => {
                const previous = newestFirst[i + 1];
                const diff = previous ? Number(entry.weight) - Number(previous.weight) : null;
                return (
                  <ActionCard
                    key={entry.date}
                    className={`rounded-md rim mb-2 ${entry.date === date ? 'bg-elevated border-accent' : 'bg-surface border-edge'}`}
                  >
                    <TouchableOpacity className="pl-5 pr-3 py-4 flex-row items-center gap-3" onPress={() => edit(entry)} activeOpacity={0.85}>
                      <View className="flex-1">
                        <Text className="text-primary text-sm font-bold" numberOfLines={1}>{longDate(entry.date)}</Text>
                        {entry.note ? <Text className="text-muted text-xs mt-0.5" numberOfLines={2}>{entry.note}</Text> : null}
                      </View>
                      <View className="items-end">
                        <Text className="text-primary text-base font-mono-bold">{formatWeight(entry.weight)} kg</Text>
                        {diff != null && Math.abs(diff) >= 0.05 && (
                          <Text className="text-muted text-[10px] font-mono">{formatSigned(diff, 1)}</Text>
                        )}
                      </View>
                      <ActionMenu
                        accessibilityLabel={`Options for ${longDate(entry.date)}`}
                        actions={[
                          { icon: 'pencil-outline', label: 'Edit', onPress: () => edit(entry) },
                          { icon: 'trash-outline', label: 'Delete', destructive: true, onPress: () => handleDelete(entry) },
                        ]}
                      />
                    </TouchableOpacity>
                  </ActionCard>
                );
              })}
              {newestFirst.length > LIST_COLLAPSED && (
                <TouchableOpacity onPress={() => setShowAll(!showAll)} className="py-3 items-center">
                  <Text className="text-accent-text text-[10px] font-bold tracking-[2px]">
                    {showAll ? 'SHOW LESS' : `SHOW ALL ${newestFirst.length}`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityLabel={label}
      className="w-12 h-12 rounded-sm bg-elevated items-center justify-center"
    >
      <Ionicons name={icon} size={22} color={c.primary} />
    </TouchableOpacity>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View className="flex-1 pr-2">
      <Text className={`${accent ? 'text-accent-text' : 'text-primary'} text-lg font-mono-bold tracking-tight`} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">{label}</Text>
    </View>
  );
}
