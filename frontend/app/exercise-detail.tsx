import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseDetail } from '@/hooks/useExerciseDetail';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import { ExerciseProgressChart } from '@/components/exercise-progress-chart';
import { useTheme } from '@/hooks/useTheme';
import { getPersonalRecords, formatKg } from '@/utils/strength';

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
  const c = useTheme();
  const records = getPersonalRecords(progress?.entries ?? []);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return null;
  };
  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">EXERCISE</Text>
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9">{exerciseName}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* Planned */}
        {(sets || reps || weight) && (
          <View className="bg-surface rounded-md p-5 mb-2">
            <Text className="text-muted text-[9px] tracking-[3px] mb-3">PLANNED</Text>
            <View className="flex-row gap-6">
              {sets && reps && (
                <View>
                  <Text className="text-accent-text text-[28px] font-bold tracking-tighter leading-8">{sets}×{reps}</Text>
                  <Text className="text-muted text-[9px] tracking-[2px] mt-1">SETS × REPS</Text>
                </View>
              )}
              {weight && (
                <View>
                  <Text className="text-accent-text text-[28px] font-bold tracking-tighter leading-8">{weight}</Text>
                  <Text className="text-muted text-[9px] tracking-[2px] mt-1">KG TARGET</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Records */}
        {records.bestWeight != null && (
          <View className="bg-surface rounded-md p-5 mb-2">
            <Text className="text-muted text-[9px] tracking-[3px] mb-3">PERSONAL RECORDS</Text>
            <View className="flex-row gap-6">
              <View>
                <Text className="text-accent-text text-[28px] font-bold tracking-tighter leading-8">{formatKg(records.bestWeight)}</Text>
                <Text className="text-muted text-[9px] tracking-[2px] mt-1">KG HEAVIEST</Text>
              </View>
              {records.bestOneRepMax != null && (
                <View>
                  <Text className="text-accent-text text-[28px] font-bold tracking-tighter leading-8">{formatKg(records.bestOneRepMax)}</Text>
                  <Text className="text-muted text-[9px] tracking-[2px] mt-1">KG EST. 1RM</Text>
                </View>
              )}
              <View>
                <Text className="text-accent-text text-[28px] font-bold tracking-tighter leading-8">{records.sessions}</Text>
                <Text className="text-muted text-[9px] tracking-[2px] mt-1">SESSIONS</Text>
              </View>
            </View>
          </View>
        )}

        {/* Video */}
        <View className="bg-surface rounded-md p-5 mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-muted text-[9px] tracking-[3px]">VIDEO</Text>
            <TouchableOpacity onPress={() => setEditingVideo(!editingVideo)}>
              <Ionicons name={editingVideo ? 'close-outline' : 'pencil-outline'} size={18} color={c.muted} />
            </TouchableOpacity>
          </View>

          {editingVideo ? (
            <View>
              <TextInput
                className="bg-base rounded px-3 py-3 text-primary text-sm mb-2"
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={c.elevated}
                value={videoUrl}
                onChangeText={setVideoUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                className={`bg-accent rounded py-3 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveVideo(videoUrl, () => setEditingVideo(false))}
                disabled={isPending}
              >
                <Text className="text-accent-fg text-[11px] font-bold tracking-[2px]">
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
              className="h-28 items-center justify-center bg-base rounded gap-2"
              onPress={() => setEditingVideo(true)}
            >
              <Ionicons name="play-circle-outline" size={40} color={c.elevated} />
              <Text className="text-elevated text-[10px] tracking-[2px]">TAP TO ADD YOUTUBE VIDEO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Chart */}
        <View className="bg-surface rounded-md p-5 mb-2">
          <Text className="text-muted text-[9px] tracking-[3px] mb-3">WEIGHT PROGRESS</Text>
          {progressLoading ? (
            <View className="items-center py-6">
              <Text className="text-elevated text-[10px] tracking-[3px]">LOADING...</Text>
            </View>
          ) : (
            <ExerciseProgressChart entries={progress?.entries ?? []} />
          )}
        </View>

        {/* Description */}
        <View className="bg-surface rounded-md p-5 mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-muted text-[9px] tracking-[3px]">NOTES</Text>
            <TouchableOpacity onPress={() => setEditingDescription(!editingDescription)}>
              <Ionicons name={editingDescription ? 'close-outline' : 'pencil-outline'} size={18} color={c.muted} />
            </TouchableOpacity>
          </View>

          {editingDescription ? (
            <View>
              <TextInput
                className="bg-base rounded px-3 py-3 text-primary text-sm mb-2"
                placeholder="Cues, form tips..."
                placeholderTextColor={c.elevated}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                autoFocus
                keyboardAppearance="dark"
                style={{ textAlignVertical: 'top', minHeight: 90 }}
              />
              <TouchableOpacity
                className={`bg-accent rounded py-3 items-center ${isPending ? 'opacity-50' : ''}`}
                onPress={() => saveDescription(description, () => setEditingDescription(false))}
                disabled={isPending}
              >
                <Text className="text-accent-fg text-[11px] font-bold tracking-[2px]">
                  {isPending ? 'SAVING...' : 'SAVE NOTES'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : description ? (
            <TouchableOpacity onPress={() => setEditingDescription(true)}>
              <Text className="text-muted text-sm leading-5">{description}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-24 items-center justify-center bg-base rounded gap-2"
              onPress={() => setEditingDescription(true)}
            >
              <Ionicons name="document-text-outline" size={32} color={c.elevated} />
              <Text className="text-elevated text-[10px] tracking-[2px]">TAP TO ADD NOTES</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
