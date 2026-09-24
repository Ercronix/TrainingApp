import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseDetail } from '@/hooks/useExerciseDetail';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import { ExerciseAnalytics } from '@/components/ExerciseAnalytics';
import { OneRepMaxCalculator } from '@/components/OneRepMaxCalculator';
import { useTheme } from '@/hooks/useTheme';
import { estimateOneRepMax } from '@/utils/strength';
import { setsOf, workingSets } from '@/utils/sets';
import { useLibrary } from '@/hooks/useLibrary';
import { confirm } from '@/utils/confirm';

export default function ExerciseDetailScreen() {
  const {
    exerciseId, exerciseName, description: initialDescription,
    videoUrl: initialVideoUrl, sets, reps, weight, workoutId, libraryExerciseId, fromLibrary,
  } = useLocalSearchParams<{
    exerciseId: string; exerciseName: string; description: string;
    videoUrl: string; sets: string; reps: string; weight: string; workoutId: string;
    libraryExerciseId: string; fromLibrary: string;
  }>();
  // Opened from the library: there is no workout exercise, and the entry can be renamed or deleted
  const isLibraryView = fromLibrary === '1' && !!libraryExerciseId;

  const router = useRouter();
  const { saveVideo, saveDescription, saveName, isPending } = useExerciseDetail(workoutId, exerciseId, libraryExerciseId);
  const { library, deleteEntry } = useLibrary();
  const [name, setName] = useState(exerciseName || '');
  const [editingName, setEditingName] = useState(false);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [editingVideo, setEditingVideo] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const { progress, isLoading: progressLoading } = useExerciseProgress(exerciseId, libraryExerciseId);
  const c = useTheme();
  const libraryId = progress?.libraryExerciseId ?? (libraryExerciseId ? Number(libraryExerciseId) : null);
  const timed = library.find((l) => l.id === libraryId)?.repUnit === 'seconds';
  // Seed the calculator with the set behind the best estimated 1RM
  let bestSet: { weight: number; reps: number } | undefined;
  if (!timed) {
    for (const set of (progress?.entries ?? []).flatMap((e) => workingSets(setsOf(e)))) {
      const weight = Number(set.weight ?? 0);
      if (weight <= 0 || set.reps <= 0) continue;
      if (!bestSet || estimateOneRepMax(weight, set.reps) > estimateOneRepMax(bestSet.weight, bestSet.reps)) {
        bestSet = { weight, reps: set.reps };
      }
    }
  }

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return null;
  };
  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  const handleDelete = () => {
    confirm('Delete Exercise', `Remove "${name}" from your library?`,
      () => deleteEntry.mutate(Number(libraryExerciseId), { onSuccess: () => router.back() }), 'Delete');
  };

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">{isLibraryView ? 'LIBRARY EXERCISE' : 'EXERCISE'}</Text>
        {editingName ? (
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-surface rounded px-3 py-2 text-primary text-[22px] font-bold tracking-tight"
              value={name}
              onChangeText={setName}
              autoFocus
              keyboardAppearance="dark"
              editable={!isPending}
              onSubmitEditing={() => saveName(name, () => setEditingName(false))}
            />
            <TouchableOpacity onPress={() => saveName(name, () => setEditingName(false))} disabled={isPending}>
              <Ionicons name="checkmark" size={22} color={c.accent} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 text-primary text-[32px] font-bold tracking-tighter leading-9">{name}</Text>
            {isLibraryView && (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Ionicons name="pencil-outline" size={18} color={c.muted} />
              </TouchableOpacity>
            )}
          </View>
        )}
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

        {/* Statistics */}
        {progressLoading ? (
          <View className="bg-surface rounded-md p-5 mb-2 items-center py-6">
            <Text className="text-muted text-[10px] tracking-[3px]">LOADING...</Text>
          </View>
        ) : (
          <ExerciseAnalytics entries={progress?.entries ?? []} timed={timed} />
        )}

        {!timed && !progressLoading && (
          <View className="bg-surface rounded-md p-5 mb-2">
            <Text className="text-muted text-[9px] tracking-[3px] mb-3">1RM CALCULATOR</Text>
            <OneRepMaxCalculator
              key={bestSet ? `${bestSet.weight}x${bestSet.reps}` : 'empty'}
              initialWeight={bestSet?.weight}
              initialReps={bestSet?.reps}
            />
          </View>
        )}

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

        {isLibraryView && (
          <TouchableOpacity
            className={`bg-surface rounded-md py-5 mt-2 flex-row items-center justify-center gap-2 ${deleteEntry.isPending ? 'opacity-50' : ''}`}
            onPress={handleDelete}
            disabled={deleteEntry.isPending}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={18} color={c.danger} />
            <Text className="text-danger text-sm font-bold tracking-[2px]">DELETE FROM LIBRARY</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
