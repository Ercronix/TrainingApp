import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { confirm, alert } from '@/utils/confirm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { RestTimer } from '@/components/RestTimer';

export default function TrainingScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();

  const { training, isLoading, updateExerciseLog, completeTraining } = useTraining(trainingLogId);

  const toggleExercise = (exerciseLog: any) => {
    const completing = !exerciseLog.completed;
    const data: any = { completed: completing };

    if (completing) {
      if (!exerciseLog.setsCompleted || exerciseLog.setsCompleted === 0) {
        data.setsCompleted = exerciseLog.plannedSets ?? 0;
      }
      if (!exerciseLog.repsCompleted || exerciseLog.repsCompleted === 0) {
        data.repsCompleted = exerciseLog.plannedReps ?? 0;
      }
      if (!exerciseLog.weightUsed && exerciseLog.plannedWeight) {
        data.weightUsed = exerciseLog.plannedWeight;
      }
    }
    updateExerciseLog.mutate({ exerciseLogId: exerciseLog.id, data });
  };

  const handleComplete = () => {
    const completedCount = training?.exercises.filter((e: any) => e.completed).length || 0;
    const totalCount = training?.exercises.length || 0;

    const doComplete = () =>
      completeTraining.mutate(undefined, {
        onSuccess: () => {
          alert('Success', 'Training completed!');
          router.replace('/(tabs)');
        },
      });

    if (completedCount < totalCount) {
      confirm(
        'Incomplete Training',
        `You've only completed ${completedCount}/${totalCount} exercises. Complete anyway?`,
        doComplete,
        'Complete',
        'Cancel'
      );
    } else {
      doComplete();
    }
  };

  const renderExerciseItem = ({ item }: { item: any }) => (
    <View
      className={`bg-white rounded-xl mb-3 border ${
        item.completed ? 'border-green-500' : 'border-gray-200'
      }`}
    >
      <View className="flex-row">
        {/* Exercise info — tap to see details/video */}
        <TouchableOpacity
          className="flex-1 p-4"
          onPress={() =>
            router.push({
              pathname: '/exercise-detail' as any,
              params: {
                exerciseId: item.exerciseId?.toString() ?? '',
                exerciseName: item.exerciseName,
                description: '',
                videoUrl: '',
                sets: item.plannedSets?.toString() || '',
                reps: item.plannedReps?.toString() || '',
                weight: item.plannedWeight?.toString() || '',
                workoutId: item.workoutId?.toString() ?? '',
              },
            })
          }
        >
          <View className="flex-row items-start">
            <View className="flex-1">
              {item.workoutName && (
                <Text className="text-xs text-gray-400 mb-0.5">{item.workoutName}</Text>
              )}
              <Text
                className={`text-base font-semibold ${
                  item.completed ? 'text-green-700' : 'text-gray-800'
                }`}
              >
                {item.exerciseName}
                {item.completed && ' ✓'}
              </Text>
              {item.plannedSets && item.plannedReps && (
                <Text className="text-sm text-gray-600 mt-1">
                  {item.plannedSets} × {item.plannedReps} reps
                  {item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
                </Text>
              )}
              {item.completed && (
                <Text className="text-xs text-green-600 font-medium mt-1">
                  ✓ Logged: {item.setsCompleted}×{item.repsCompleted}
                  {item.weightUsed != null ? ` @ ${item.weightUsed} kg` : ''}
                </Text>
              )}
            </View>
            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Toggle complete checkbox */}
        <TouchableOpacity
          className="w-16 justify-center items-center border-l border-gray-200"
          onPress={() => toggleExercise(item)}
        >
          <View
            className={`w-6 h-6 rounded-full justify-center items-center ${
              item.completed ? 'bg-green-500' : 'border-2 border-gray-300'
            }`}
          >
            {item.completed && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
        </TouchableOpacity>

        {/* Log button */}
        <TouchableOpacity
          className="w-16 justify-center items-center border-l border-gray-200"
          onPress={() =>
            router.push({
              pathname: '/log-exercise' as any,
              params: {
                exerciseLogId: item.id.toString(),
                exerciseName: item.exerciseName,
                plannedSets: item.plannedSets?.toString() || '',
                plannedReps: item.plannedReps?.toString() || '',
                plannedWeight: item.plannedWeight?.toString() || '',
                trainingLogId,
              },
            })
          }
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={item.completed ? '#10B981' : '#3B82F6'}
          />
          <Text className={`text-xs mt-1 ${item.completed ? 'text-green-600' : 'text-blue-600'}`}>
            Log
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">Loading training...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises.filter((e: any) => e.completed).length || 0;
  const totalCount = training?.exercises.length || 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-blue-500 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">{training?.splitName}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {completedCount}/{totalCount} exercises completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="bg-white px-6 py-3">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-green-500"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </View>
      </View>

      {/* Exercise List */}
      <FlatList
        data={training?.exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
      />

      {/* Bottom — Rest Timer + Complete */}
      <View className="bg-white border-t border-gray-200">
        <View className="px-4 pt-4">
          <RestTimer
            duration={120}
            onComplete={() => alert('Rest Complete!', 'Time for next set!')}
          />
        </View>
        <View className="p-4">
          <TouchableOpacity
            className={`bg-green-500 rounded-lg py-4 items-center ${
              completeTraining.isPending ? 'opacity-50' : ''
            }`}
            onPress={handleComplete}
            disabled={completeTraining.isPending}
          >
            <Text className="text-white text-lg font-semibold">
              {completeTraining.isPending ? 'Completing...' : 'Complete Training'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
