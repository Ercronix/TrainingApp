import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { RestTimer } from '@/components/RestTimer';

export default function TrainingScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();

  const { training, isLoading, updateExercise, completeTraining } = useTraining(trainingLogId);

  const toggleExercise = (exerciseLog: any) => {
    updateExercise.mutate({
      exerciseLogId: exerciseLog.id,
      data: { completed: !exerciseLog.completed }
    });
  };

  const handleComplete = () => {
    const completedCount = training?.exercises.filter((e: any) => e.completed).length || 0;
    const totalCount = training?.exercises.length || 0;

    if (completedCount < totalCount) {
      Alert.alert(
        'Incomplete Training',
        `You've only completed ${completedCount}/${totalCount} exercises. Complete anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: () => {
              completeTraining.mutate(undefined, {
                onSuccess: () => {
                  Alert.alert('Success', 'Training completed! 💪', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                  ]);
                }
              });
            }
          }
        ]
      );
    } else {
      completeTraining.mutate(undefined, {
        onSuccess: () => {
          Alert.alert('Success', 'Training completed! 💪', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
          ]);
        }
      });
    }
  };

  const renderExerciseItem = ({ item }: { item: any }) => (
    <View className={`bg-white rounded-xl mb-3 border ${
      item.completed ? 'border-green-500' : 'border-gray-200'
    }`}>
      <View className="flex-row">
        {/* Main Exercise Info - Click opens description */}
        <TouchableOpacity
          className="flex-1 p-4"
          onPress={() => {
            // Open workout detail (description + video)
            router.push({
              pathname: '/workout-detail' as any,
              params: {
                workoutId: item.workoutId.toString(),
                name: item.workoutName,
                description: '', // Backend doesn't return this in exerciseLog
                videoUrl: '', // Backend doesn't return this either
                sets: item.plannedSets?.toString() || '',
                reps: item.plannedReps?.toString() || '',
                weight: item.plannedWeight?.toString() || '',
              }
            });
          }}
        >
          <View className="flex-row items-start">
            {/* Video Icon if available */}
            <View className="flex-1">
              <Text className={`text-base font-semibold ${
                item.completed ? 'text-green-700' : 'text-gray-800'
              }`}>
                {item.workoutName}
                {item.completed && ' ✓'}
              </Text>

              {item.plannedSets && item.plannedReps && (
                <Text className="text-sm text-gray-600 mt-1">
                  {item.plannedSets} × {item.plannedReps} reps
                  {item.plannedWeight && ` @ ${item.plannedWeight}kg`}
                </Text>
              )}

              {/* Logged Data */}
              {item.completed && item.weightUsed && (
                <Text className="text-xs text-green-600 font-medium mt-1">
                  ✓ Logged: {item.setsCompleted}×{item.repsCompleted} @ {item.weightUsed}kg
                </Text>
              )}
            </View>

            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Checkbox - Toggle complete */}
        <TouchableOpacity
          className="w-16 justify-center items-center border-l border-gray-200"
          onPress={() => toggleExercise(item)}
        >
          <View className={`w-6 h-6 rounded-full justify-center items-center ${
            item.completed ? 'bg-green-500' : 'border-2 border-gray-300'
          }`}>
            {item.completed && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Log Button */}
        <TouchableOpacity
          className="w-16 justify-center items-center border-l border-gray-200"
          onPress={() => {
            router.push({
              pathname: '/exercise-detail',
              params: {
                exerciseLogId: item.id.toString(),
                workoutName: item.workoutName,
                plannedSets: item.plannedSets?.toString() || '',
                plannedReps: item.plannedReps?.toString() || '',
                plannedWeight: item.plannedWeight?.toString() || '',
                trainingLogId: trainingLogId,
              }
            });
          }}
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={item.completed ? '#10B981' : '#3B82F6'}
          />
          <Text className={`text-xs mt-1 ${
            item.completed ? 'text-green-600' : 'text-blue-600'
          }`}>
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
        <Text className="text-2xl font-bold text-gray-800">
          {training?.splitName}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {completedCount}/{totalCount} exercises completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="bg-white px-6 py-3">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-green-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </View>
      </View>

      {/* Exercises List */}
      <FlatList
        data={training?.exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
      />

      {/* Bottom Section - Rest Timer + Complete Button */}
      <View className="bg-white border-t border-gray-200">
        {/* Rest Timer */}
        <View className="px-4 pt-4">
          <RestTimer duration={120} onComplete={() => {
            Alert.alert('Rest Complete!', 'Time for next set! 💪');
          }} />
        </View>

        {/* Complete Button */}
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