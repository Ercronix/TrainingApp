import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

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
  const [range, setRange] = useState<'10' | 'all'>('10');

  const withWeight = entries.filter((e) => e.weightUsed != null && Number(e.weightUsed) > 0);
  const displayed = range === '10' ? withWeight.slice(-10) : withWeight;

  if (withWeight.length === 0) {
    return (
      <View className="items-center py-8">
        <Ionicons name="trending-up-outline" size={36} color="#475569" />
        <Text className="text-sm text-slate-500 mt-2">No weight data yet</Text>
        <Text className="text-xs text-slate-500 mt-1">
          Log weight during training to see your progress
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
    datasets: [{ data: weights, color: () => '#60A5FA', strokeWidth: 2 }],
  };

  return (
    <View>
      {/* Stats row */}
      <View className="flex-row justify-around mb-4">
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-100">{personalBest} kg</Text>
          <Text className="text-xs text-slate-500">Personal Best</Text>
        </View>
        <View className="w-px bg-slate-800" />
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-100">{lastWeight} kg</Text>
          <Text className="text-xs text-slate-500">Last Session</Text>
        </View>
        <View className="w-px bg-slate-800" />
        <View className="items-center">
          <Text
            className={`text-lg font-bold ${
              trend > 0 ? 'text-blue-300' : trend < 0 ? 'text-red-400' : 'text-slate-100'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
          <Text className="text-xs text-slate-500">All Time</Text>
        </View>
      </View>

      {/* Range toggle */}
      {withWeight.length > 10 && (
        <View className="flex-row justify-end mb-2 gap-2">
          {(['10', 'all'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`px-3 py-1 rounded-full ${range === r ? 'bg-blue-600' : 'bg-slate-800'}`}
            >
              <Text className={`text-xs font-medium ${range === r ? 'text-white' : 'text-slate-300'}`}>
                {r === '10' ? 'Last 10' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={chartData}
          width={Math.max(CHART_WIDTH, displayed.length * 50)}
          height={180}
          chartConfig={{
            backgroundColor: '#0F172A',
            backgroundGradientFrom: '#0F172A',
            backgroundGradientTo: '#0F172A',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
            labelColor: () => '#64748B',
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#0F172A' },
            propsForBackgroundLines: { stroke: '#1E293B' },
          }}
          bezier
          style={{ borderRadius: 8 }}
          withInnerLines
          withOuterLines={false}
          withVerticalLabels={displayed.length <= 12}
          withHorizontalLabels
          formatYLabel={(v) => `${v}kg`}
          getDotColor={(dataPoint) =>
            dataPoint === personalBest ? '#93C5FD' : '#60A5FA'
          }
        />
      </ScrollView>

      {displayed.length > 1 && (
        <Text className="text-xs text-slate-500 text-center mt-2">
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
