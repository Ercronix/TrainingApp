import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { formatKg } from '@/utils/strength';
import { oneRepMaxBreakdown, repMaxTable, roundToIncrement } from '@/utils/stats';

interface Props {
  initialWeight?: number;
  initialReps?: number;
}

const RELIABILITY = {
  high: 'Sets of 1–5 reps give the most accurate estimates.',
  medium: 'Sets of 6–10 reps: estimates start to drift apart.',
  low: 'Above 10 reps estimates are rough. Test with a heavier set.',
};

export function OneRepMaxCalculator({ initialWeight, initialReps }: Props) {
  const c = useTheme();
  const [weight, setWeight] = useState(initialWeight ? String(initialWeight) : '');
  const [reps, setReps] = useState(initialReps ? String(initialReps) : '');

  const w = parseFloat(weight.replace(',', '.'));
  const r = parseInt(reps, 10);
  const breakdown = oneRepMaxBreakdown(w, r);
  // Epley stays the reference estimate so it matches records elsewhere in the app
  const oneRm = breakdown?.formulas.find((f) => f.id === 'epley')?.value ?? 0;

  return (
    <View>
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Text className="text-muted text-[9px] tracking-[2px] mb-1">WEIGHT (KG)</Text>
          <TextInput
            className="bg-base rounded px-3 py-3 text-primary text-lg font-mono-bold"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor={c.subtle}
            keyboardAppearance="dark"
          />
        </View>
        <View className="flex-1">
          <Text className="text-muted text-[9px] tracking-[2px] mb-1">REPS</Text>
          <TextInput
            className="bg-base rounded px-3 py-3 text-primary text-lg font-mono-bold"
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={c.subtle}
            keyboardAppearance="dark"
          />
        </View>
      </View>

      {!breakdown ? (
        <Text className="text-muted text-xs text-center py-4">Enter a weight and reps to estimate your 1RM</Text>
      ) : (
        <>
          {/* Headline */}
          <View className="flex-row items-end justify-between mb-1">
            <View>
              <Text className="text-accent-text text-[40px] font-mono-bold tracking-tighter leading-[44px]">{formatKg(round1(oneRm))}</Text>
              <Text className="text-muted text-[9px] tracking-[2px]">KG EST. 1RM (EPLEY)</Text>
            </View>
            <View className="items-end">
              <Text className="text-primary text-sm font-mono-bold">
                {formatKg(round1(breakdown.low))}–{formatKg(round1(breakdown.high))}
              </Text>
              <Text className="text-muted text-[9px] tracking-[2px]">RANGE · AVG {formatKg(round1(breakdown.average))}</Text>
            </View>
          </View>
          <Text className={`text-[11px] mb-4 ${breakdown.reliability === 'low' ? 'text-danger' : 'text-muted'}`}>
            {RELIABILITY[breakdown.reliability]}
          </Text>

          {/* Formula comparison */}
          <Text className="text-muted text-[9px] tracking-[3px] mb-2">BY FORMULA</Text>
          <View className="bg-base rounded-sm mb-4">
            {breakdown.formulas.map((f) => {
              const share = (f.value - breakdown.low * 0.95) / (breakdown.high - breakdown.low * 0.95 || 1);
              return (
                <View key={f.id} className="flex-row items-center px-3 py-2 gap-3">
                  <Text className="text-muted text-xs w-[72px]">{f.name}</Text>
                  <View className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                    <View className="h-full bg-accent rounded-full" style={{ width: `${Math.max(4, share * 100)}%` }} />
                  </View>
                  <Text className="text-primary text-xs font-mono-bold w-[56px] text-right">{f.value.toFixed(1)}</Text>
                </View>
              );
            })}
          </View>

          {/* Rep maxes */}
          <Text className="text-muted text-[9px] tracking-[3px] mb-2">REP MAXES</Text>
          <View className="bg-base rounded-sm">
            <View className="flex-row px-3 py-2">
              <Text className="flex-1 text-muted text-[9px] tracking-[2px]">REPS</Text>
              <Text className="flex-1 text-muted text-[9px] tracking-[2px] text-right">% 1RM</Text>
              <Text className="flex-1 text-muted text-[9px] tracking-[2px] text-right">EXACT</Text>
              <Text className="flex-1 text-muted text-[9px] tracking-[2px] text-right">LOAD</Text>
            </View>
            {repMaxTable(oneRm).map((row) => (
              <View key={row.reps} className={`flex-row px-3 py-1.5 ${row.reps === r ? 'bg-elevated' : ''}`}>
                <Text className="flex-1 text-primary text-xs font-mono-bold">{row.reps}</Text>
                <Text className="flex-1 text-muted text-xs font-mono text-right">{Math.round(row.percent)}%</Text>
                <Text className="flex-1 text-muted text-xs font-mono text-right">{row.weight.toFixed(1)}</Text>
                <Text className="flex-1 text-accent-text text-xs font-mono-bold text-right">{formatKg(roundToIncrement(row.weight))}</Text>
              </View>
            ))}
          </View>
          <Text className="text-muted text-[10px] mt-2">LOAD is rounded to the nearest 2.5 kg.</Text>
        </>
      )}
    </View>
  );
}

const round1 = (v: number) => Math.round(v * 10) / 10;
