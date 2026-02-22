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
        <Ionicons name="trending-up-outline" size={36} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 mt-2">No weight data yet</Text>
        <Text className="text-xs text-gray-400 mt-1">
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
    datasets: [{ data: weights, color: () => '#3B82F6', strokeWidth: 2 }],
  };

  return (
    <View>
      {/* Stats row */}
      <View className="flex-row justify-around mb-4">
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">{personalBest} kg</Text>
          <Text className="text-xs text-gray-400">Personal Best</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">{lastWeight} kg</Text>
          <Text className="text-xs text-gray-400">Last Session</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text
            className={`text-lg font-bold ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-800'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
          <Text className="text-xs text-gray-400">All Time</Text>
        </View>
      </View>

      {/* Range toggle */}
      {withWeight.length > 10 && (
        <View className="flex-row justify-end mb-2 gap-2">
          {(['10', 'all'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`px-3 py-1 rounded-full ${range === r ? 'bg-blue-500' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-medium ${range === r ? 'text-white' : 'text-gray-500'}`}>
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
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: () => '#9CA3AF',
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffffff' },
            propsForBackgroundLines: { stroke: '#F3F4F6' },
          }}
          bezier
          style={{ borderRadius: 8 }}
          withInnerLines
          withOuterLines={false}
          withVerticalLabels={displayed.length <= 12}
          withHorizontalLabels
          formatYLabel={(v) => `${v}kg`}
          getDotColor={(dataPoint) =>
            dataPoint === personalBest ? '#10B981' : '#3B82F6'
          }
        />
      </ScrollView>

      {displayed.length > 1 && (
        <Text className="text-xs text-gray-400 text-center mt-2">
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
