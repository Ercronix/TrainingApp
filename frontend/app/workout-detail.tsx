import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';

export default function WorkoutDetailScreen() {
  const { workoutId, name } = useLocalSearchParams<{
    workoutId: string;
    name: string;
  }>();

  const router = useRouter();
  const { workout, isLoading } = useWorkoutDetail(workoutId);

  const getYouTubeId = (url: string) => {
    if (!url) return null;

    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1].split('&')[0];
    }

    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }

    return null;
  };

  const videoId = workout?.videoUrl ? getYouTubeId(workout.videoUrl) : null;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-blue-500 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">
          {workout?.name || name}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* YouTube Video mit WebView */}
        {videoId && (
          <View style={{ height: 250, backgroundColor: 'black' }}>
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        * { margin: 0; padding: 0; }
                        html, body { height: 100%; overflow: hidden; }
                        iframe { 
                          width: 100%; 
                          height: 100%; 
                          border: none;
                        }
                      </style>
                    </head>
                    <body>
                      <iframe
                        src="https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                      ></iframe>
                    </body>
                  </html>
                `
              }}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        )}

        {/* Info Cards */}
        <View className="p-4">
          {/* Planned Info */}
          {(workout?.sets || workout?.reps || workout?.plannedWeight) && (
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Planned Workout
              </Text>
              {workout?.sets && workout?.reps && (
                <Text className="text-base text-gray-800">
                  • {workout.sets} sets × {workout.reps} reps
                </Text>
              )}
              {workout?.plannedWeight && (
                <Text className="text-base text-gray-800">
                  • Weight: {workout.plannedWeight} kg
                </Text>
              )}
            </View>
          )}

          {/* Last Used Weight */}
          {workout?.lastUsedWeight && (
            <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
              <Text className="text-sm font-semibold text-green-700 mb-2">
                Last Training
              </Text>
              <Text className="text-base text-green-800">
                • Weight: {workout.lastUsedWeight} kg
              </Text>
              {workout?.lastTrainedAt && (
                <Text className="text-sm text-green-700 mt-1">
                  • {new Date(workout.lastTrainedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Description */}
          {workout?.description && (
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Description
              </Text>
              <Text className="text-base text-gray-600">
                {workout.description}
              </Text>
            </View>
          )}

          {/* No Video Notice */}
          {!videoId && (
            <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <Text className="text-sm text-yellow-800">
                No video available for this workout
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}