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
    exerciseId, exerciseName, description: initialDescription,
    videoUrl: initialVideoUrl, sets, reps, weight, workoutId,
  } = useLocalSearchParams<{
    exerciseId: string; exerciseName: string; description: string;
    videoUrl: string; sets: string; reps: string; weight: string; workoutId: string;
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
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color="#cafd00" />
        </TouchableOpacity>
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">EXERCISE</Text>
        <Text className="text-[#f5f5f5] text-[32px] font-bold tracking-tighter leading-9">{exerciseName}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {/* Planned */}
        {(sets || reps || weight) && (
          <View className="bg-[#131313] rounded-md p-5 mb-2">
            <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-3">PLANNED</Text>
            <View className="flex-row gap-6">
              {sets && reps && (
                <View>
                  <Text className="text-[#cafd00] text-[28px] font-bold tracking-tighter leading-8">{sets}×{reps}</Text>
                  <Text className="text-[#4a4a4a] text-[9px] tracking-[2px] mt-1">SETS × REPS</Text>
                </View>
              )}
              {weight && (
                <View>
                  <Text className="text-[#cafd00] text-[28px] font-bold tracking-tighter leading-8">{weight}</Text>
                  <Text className="text-[#4a4a4a] text-[9px] tracking-[2px] mt-1">KG TARGET</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Video */}
        <View className="bg-[#131313] rounded-md p-5 mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#4a4a4a] text-[9px] tracking-[3px]">VIDEO</Text>
            <TouchableOpacity onPress={() => setEditingVideo(!editingVideo)}>
              <Ionicons name={editingVideo ? 'close-outline' : 'pencil-outline'} size={18} color="#4a4a4a" />
            </TouchableOpacity>
          </View>

          {editingVideo ? (
            <View>
              <TextInput
                className="bg-[#0e0e0e] rounded px-3 py-3 text-[#f5f5f5] text-sm mb-2"
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#2a2a2a"
                value={videoUrl}
                onChangeText={setVideoUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                className={`bg-[#cafd00] rounded py-3 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveVideo(videoUrl, () => setEditingVideo(false))}
                disabled={isPending}
              >
                <Text className="text-[#0e0e0e] text-[11px] font-bold tracking-[2px]">
                  {isPending ? 'SAVING...' : 'SAVE VIDEO'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : videoId ? (
            <View className="rounded overflow-hidden">
              <YoutubePlayer height={200} videoId={videoId} play={false} />
            </View>
          ) : (
            <TouchableOpacity
              className="h-28 items-center justify-center bg-[#0e0e0e] rounded gap-2"
              onPress={() => setEditingVideo(true)}
            >
              <Ionicons name="play-circle-outline" size={40} color="#2a2a2a" />
              <Text className="text-[#2a2a2a] text-[10px] tracking-[2px]">TAP TO ADD YOUTUBE VIDEO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Chart */}
        <View className="bg-[#131313] rounded-md p-5 mb-2">
          <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-3">WEIGHT PROGRESS</Text>
          {progressLoading ? (
            <View className="items-center py-6">
              <Text className="text-[#2a2a2a] text-[10px] tracking-[3px]">LOADING...</Text>
            </View>
          ) : (
            <ExerciseProgressChart entries={progress?.entries ?? []} />
          )}
        </View>

        {/* Description */}
        <View className="bg-[#131313] rounded-md p-5 mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#4a4a4a] text-[9px] tracking-[3px]">NOTES</Text>
            <TouchableOpacity onPress={() => setEditingDescription(!editingDescription)}>
              <Ionicons name={editingDescription ? 'close-outline' : 'pencil-outline'} size={18} color="#4a4a4a" />
            </TouchableOpacity>
          </View>

          {editingDescription ? (
            <View>
              <TextInput
                className="bg-[#0e0e0e] rounded px-3 py-3 text-[#f5f5f5] text-sm mb-2"
                placeholder="Cues, form tips..."
                placeholderTextColor="#2a2a2a"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                autoFocus
                keyboardAppearance="dark"
                style={{ textAlignVertical: 'top', minHeight: 90 }}
              />
              <TouchableOpacity
                className={`bg-[#cafd00] rounded py-3 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveDescription(description, () => setEditingDescription(false))}
                disabled={isPending}
              >
                <Text className="text-[#0e0e0e] text-[11px] font-bold tracking-[2px]">
                  {isPending ? 'SAVING...' : 'SAVE NOTES'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : description ? (
            <TouchableOpacity onPress={() => setEditingDescription(true)}>
              <Text className="text-[#adaaaa] text-sm leading-5">{description}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-24 items-center justify-center bg-[#0e0e0e] rounded gap-2"
              onPress={() => setEditingDescription(true)}
            >
              <Ionicons name="document-text-outline" size={32} color="#2a2a2a" />
              <Text className="text-[#2a2a2a] text-[10px] tracking-[2px]">TAP TO ADD NOTES</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
