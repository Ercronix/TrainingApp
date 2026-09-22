import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ExerciseProgressEntry } from '@/types';

interface Props {
  entries: ExerciseProgressEntry[];
}

const CHART_WIDTH = Dimensions.get('window').width - 64;

export function ExerciseProgressChart({ entries }: Props) {
  const [range, setRange] = useState<'10' | 'all'>('10');
  const c = useTheme();

  const withWeight = entries.filter((e) => e.weightUsed != null && Number(e.weightUsed) > 0);
  const displayed = range === '10' ? withWeight.slice(-10) : withWeight;

  if (withWeight.length === 0) {
    return (
      <View className="items-center py-8 gap-2">
        <Ionicons name="trending-up-outline" size={36} color={c.subtle} />
        <Text className="text-subtle text-sm font-bold tracking-widest">NO DATA YET</Text>
        <Text className="text-elevated text-[11px] text-center">
          Log weight during training to track progress
        </Text>
      </View>
    );
  }

  const weights = displayed.map((e) => Number(e.weightUsed));
  const personalBest = Math.max(...withWeight.map((e) => Number(e.weightUsed)));
  const lastWeight = weights[weights.length - 1];
  const trend = lastWeight - weights[0];

  const chartData = {
    labels: displayed.map((e) => formatShortDate(e.date)),
    datasets: [{ data: weights, color: () => c.accent, strokeWidth: 2 }],
  };

  return (
    <View>
      {/* Stats row */}
      <View className="flex-row bg-base rounded-sm mb-4">
        <View className="flex-1 items-center py-3">
          <Text className="text-accent-text text-xl font-mono-bold tracking-tight">{personalBest} kg</Text>
          <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">PERSONAL BEST</Text>
        </View>
        <View className="w-px bg-surface my-2" />
        <View className="flex-1 items-center py-3">
          <Text className="text-primary text-xl font-mono-bold tracking-tight">{lastWeight} kg</Text>
          <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">LAST SESSION</Text>
        </View>
        <View className="w-px bg-surface my-2" />
        <View className="flex-1 items-center py-3">
          <Text className={`text-xl font-mono-bold tracking-tight ${
            trend > 0 ? 'text-accent-text' : trend < 0 ? 'text-danger' : 'text-primary'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
          <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">ALL TIME</Text>
        </View>
      </View>

      {/* Range toggle */}
      {withWeight.length > 10 && (
        <View className="flex-row justify-end mb-3 gap-2">
          {(['10', 'all'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`px-3 py-1.5 rounded-sm ${r === range ? 'bg-accent' : 'bg-elevated'}`}
              activeOpacity={0.85}
            >
              <Text className={`text-[10px] font-bold tracking-widest ${r === range ? 'text-accent-fg' : 'text-muted'}`}>
                {r === '10' ? 'LAST 10' : 'ALL TIME'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="rounded-sm overflow-hidden">
        <LineChart
          data={chartData}
          width={Math.max(CHART_WIDTH, displayed.length * 50)}
          height={160}
          chartConfig={{
            backgroundColor: c.base,
            backgroundGradientFrom: c.base,
            backgroundGradientTo: c.base,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(202, 253, 0, ${opacity})`,
            labelColor: () => c.muted,
            propsForDots: { r: '4', strokeWidth: '2', stroke: c.base },
            propsForBackgroundLines: { stroke: c.surface },
          }}
          bezier
          style={{ borderRadius: 4 }}
          withInnerLines
          withOuterLines={false}
          withVerticalLabels={displayed.length <= 12}
          withHorizontalLabels
          formatYLabel={(v) => `${v}kg`}
          getDotColor={(dataPoint) =>
            dataPoint === personalBest ? '#f3ffca' : c.accent
          }
        />
      </ScrollView>

      {displayed.length > 1 && (
        <Text className="text-subtle text-[10px] text-center tracking-widest mt-2">
          {formatShortDate(displayed[0].date)} — {formatShortDate(displayed[displayed.length - 1].date)}
        </Text>
      )}
    </View>
  );
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}
