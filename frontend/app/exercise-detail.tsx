import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseDetail } from '@/hooks/useExerciseDetail';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import { ExerciseProgressChart } from '@/components/exercise-progress-chart';

export default function ExerciseDetailScreen() {
  const {
    exerciseId,
    exerciseName,
    description: initialDescription,
    videoUrl: initialVideoUrl,
    sets,
    reps,
    weight,
    workoutId,
  } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
    description: string;
    videoUrl: string;
    sets: string;
    reps: string;
    weight: string;
    workoutId: string;
  }>();

  const router = useRouter();
  const { saveVideo, saveDescription, isPending } = useExerciseDetail(workoutId, exerciseId);

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [editingVideo, setEditingVideo] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const { progress, isLoading: progressLoading } = useExerciseProgress(exerciseId);
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return null;
  };

  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-blue-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-100">{exerciseName}</Text>
      </View>

      <ScrollView className="flex-1">

        {/* Video Section */}
        <View className="mx-4 mt-4 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-800">
            <Text className="text-sm font-semibold text-slate-200">Video</Text>
            <TouchableOpacity onPress={() => setEditingVideo(!editingVideo)}>
              <Ionicons
                name={editingVideo ? 'close-outline' : 'pencil-outline'}
                size={20}
                color="#60A5FA"
              />
            </TouchableOpacity>
          </View>

          {editingVideo ? (
            <View className="p-4">
              <TextInput
                className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-base mb-3"
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#64748B"
                value={videoUrl}
                onChangeText={setVideoUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                className={`bg-blue-600 rounded-lg py-2 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveVideo(videoUrl, () => setEditingVideo(false))}
                disabled={isPending}
              >
                <Text className="text-white font-semibold">
                  {isPending ? 'Saving...' : 'Save Video'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : videoId ? (
            <YoutubePlayer
              height={220}
              videoId={videoId}
              play={false}
            />
          ) : (
            <TouchableOpacity
              className="p-4 items-center"
              onPress={() => setEditingVideo(true)}
            >
              <Ionicons name="play-circle-outline" size={36} color="#64748B" />
              <Text className="text-sm text-slate-500 mt-1">Tap to add a YouTube video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Planned Info */}
        {(sets || reps || weight) && (
          <View className="mx-4 mt-3 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-sm font-semibold text-slate-200 mb-2">Planned</Text>
            {sets && reps && (
              <Text className="text-base text-slate-100">• {sets} sets × {reps} reps</Text>
            )}
            {weight && (
              <Text className="text-base text-slate-100">• Weight: {weight} kg</Text>
            )}
          </View>
        )}
       {/* Progress Chart */}
        <View className="mx-4 mt-3 bg-slate-900 rounded-xl border border-slate-800">
          <View className="px-4 py-3 border-b border-slate-800">
            <Text className="text-sm font-semibold text-slate-200">Weight Progress</Text>
          </View>
          <View className="p-4">
            {progressLoading ? (
              <View className="items-center py-6">
                <Text className="text-sm text-slate-500">Loading progress...</Text>
              </View>
            ) : (
              <ExerciseProgressChart
                entries={progress?.entries ?? []}
              />
            )}
          </View>
        </View>
        {/* Description Section */}
        <View className="mx-4 mt-3 mb-8 bg-slate-900 rounded-xl border border-slate-800">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-800">
            <Text className="text-sm font-semibold text-slate-200">Notes / Description</Text>
            <TouchableOpacity onPress={() => setEditingDescription(!editingDescription)}>
              <Ionicons
                name={editingDescription ? 'close-outline' : 'pencil-outline'}
                size={20}
                color="#60A5FA"
              />
            </TouchableOpacity>
          </View>

          {editingDescription ? (
            <View className="p-4">
              <TextInput
                className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-base mb-3"
                placeholder="e.g., Keep elbows tucked, full range of motion..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                className={`bg-blue-600 rounded-lg py-2 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveDescription(description, () => setEditingDescription(false))}
                disabled={isPending}
              >
                <Text className="text-white font-semibold">
                  {isPending ? 'Saving...' : 'Save Notes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : description ? (
            <TouchableOpacity className="p-4" onPress={() => setEditingDescription(true)}>
              <Text className="text-base text-slate-300">{description}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="p-4 items-center"
              onPress={() => setEditingDescription(true)}
            >
              <Ionicons name="document-text-outline" size={36} color="#64748B" />
              <Text className="text-sm text-slate-500 mt-1">Tap to add notes</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
