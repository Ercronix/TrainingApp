import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/theme';

interface ProgressEntry {
  date: string;
  weightUsed: number | null;
  setsCompleted: number;
  repsCompleted: number;
  trainingLogId: number;
}

interface Props {
  entries: ProgressEntry[];
}

const CHART_WIDTH = Dimensions.get('window').width - 64;

export function ExerciseProgressChart({ entries }: Props) {
  const colors = useThemeColors();
  const [range, setRange] = useState<'10' | 'all'>('10');

  const withWeight = entries.filter((e) => e.weightUsed != null && Number(e.weightUsed) > 0);
  const displayed = range === '10' ? withWeight.slice(-10) : withWeight;

  if (withWeight.length === 0) {
    return (
      <View className="items-center py-8 gap-2">
        <Ionicons name="trending-up-outline" size={36} color={colors.inkGhost} />
        <Text className="text-ink-subtle dark:text-ink-subtle-dark text-sm font-bold tracking-widest">NO DATA YET</Text>
        <Text className="text-ink-hint dark:text-ink-hint-dark text-[11px] text-center">
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
    datasets: [{ data: weights, color: () => '#cafd00', strokeWidth: 2 }],
  };

  return (
    <View>
      {/* Stats row */}
      <View className="flex-row bg-canvas dark:bg-canvas-dark rounded-sm mb-4">
        <View className="flex-1 items-center py-3">
          <Text className="text-accent dark:text-accent-dark text-xl font-bold tracking-tight">{personalBest} kg</Text>
          <Text className="text-ink-muted dark:text-ink-muted-dark text-[8px] tracking-[2px] mt-0.5">PERSONAL BEST</Text>
        </View>
        <View className="w-px bg-surface dark:bg-surface-dark my-2" />
        <View className="flex-1 items-center py-3">
          <Text className="text-ink dark:text-ink-dark text-xl font-bold tracking-tight">{lastWeight} kg</Text>
          <Text className="text-ink-muted dark:text-ink-muted-dark text-[8px] tracking-[2px] mt-0.5">LAST SESSION</Text>
        </View>
        <View className="w-px bg-surface dark:bg-surface-dark my-2" />
        <View className="flex-1 items-center py-3">
          <Text className={`text-xl font-bold tracking-tight ${
            trend > 0 ? 'text-accent dark:text-accent-dark' : trend < 0 ? 'text-danger dark:text-danger-dark' : 'text-ink dark:text-ink-dark'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
          <Text className="text-ink-muted dark:text-ink-muted-dark text-[8px] tracking-[2px] mt-0.5">ALL TIME</Text>
        </View>
      </View>

      {/* Range toggle */}
      {withWeight.length > 10 && (
        <View className="flex-row justify-end mb-3 gap-2">
          {(['10', 'all'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`px-3 py-1.5 rounded-sm ${r === range ? 'bg-accent-solid' : 'bg-surface-2 dark:bg-surface-2-dark'}`}
              activeOpacity={0.85}
            >
              <Text className={`text-[10px] font-bold tracking-widest ${r === range ? 'text-accent-ink' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
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
            backgroundColor: colors.canvas,
            backgroundGradientFrom: '#0e0e0e',
            backgroundGradientTo: '#0e0e0e',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(202, 253, 0, ${opacity})`,
            labelColor: () => '#7a7a7a',
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#0e0e0e' },
            propsForBackgroundLines: { stroke: '#131313' },
          }}
          bezier
          style={{ borderRadius: 4 }}
          withInnerLines
          withOuterLines={false}
          withVerticalLabels={displayed.length <= 12}
          withHorizontalLabels
          formatYLabel={(v) => `${v}kg`}
          getDotColor={(dataPoint) =>
            dataPoint === personalBest ? '#f3ffca' : '#cafd00'
          }
        />
      </ScrollView>

      {displayed.length > 1 && (
        <Text className="text-ink-subtle dark:text-ink-subtle-dark text-[10px] text-center tracking-widest mt-2">
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
