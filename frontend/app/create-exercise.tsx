import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExercises } from '@/hooks/useExercises';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function CreateExerciseModal() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const { createExercise } = useExercises(workoutId);
  const [form, setForm] = useState({ name: '', sets: '', reps: '', weight: '', videoUrl: '', description: '' });
  const [repUnit, setRepUnit] = useState<'reps' | 'seconds'>('reps');
  const updateField = (field: keyof typeof form) => (value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const isPending = createExercise.isPending;
  const c = useTheme();

  const handleCreate = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Please enter an exercise name'); return; }
    createExercise.mutate({
      name: form.name.trim(),
      sets: form.sets ? parseInt(form.sets) : null,
      reps: form.reps ? parseInt(form.reps) : null,
      repUnit,
      plannedWeight: form.weight ? parseFloat(form.weight) : null,
      videoUrl: form.videoUrl.trim() || null,
      description: form.description.trim() || null,
    }, { onSuccess: () => router.back() });
  };

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">NEW EXERCISE</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text className="text-primary text-[36px] font-bold tracking-tighter leading-10 mb-8">
          ADD AN{'\n'}EXERCISE
        </Text>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">EXERCISE NAME *</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-[22px] font-bold tracking-tight mb-5"
          placeholder="Bench Press, Squat..."
          placeholderTextColor={c.elevated}
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-muted text-[9px] tracking-[3px] mb-2">SETS</Text>
            <TextInput
              className="bg-surface rounded px-4 py-4 text-primary text-lg font-bold tracking-tight"
              placeholder="4"
              placeholderTextColor={c.elevated}
              value={form.sets}
              onChangeText={updateField('sets')}
              keyboardType="numeric"
              keyboardAppearance="dark"
              editable={!isPending}
            />
          </View>
          <View className="flex-1">
            <Text className="text-muted text-[9px] tracking-[3px] mb-2">{repUnit === 'seconds' ? 'SECONDS' : 'REPS'}</Text>
            <TextInput
              className="bg-surface rounded px-4 py-4 text-primary text-lg font-bold tracking-tight"
              placeholder={repUnit === 'seconds' ? '30' : '10'}
              placeholderTextColor={c.elevated}
              value={form.reps}
              onChangeText={updateField('reps')}
              keyboardType="numeric"
              keyboardAppearance="dark"
              editable={!isPending}
            />
          </View>
        </View>

        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity
            className={`flex-1 py-3 rounded items-center ${repUnit === 'reps' ? 'bg-accent' : 'bg-surface'}`}
            onPress={() => setRepUnit('reps')}
            disabled={isPending}
          >
            <Text className={`text-[9px] font-bold tracking-[2px] ${repUnit === 'reps' ? 'text-accent-fg' : 'text-muted'}`}>REPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded items-center ${repUnit === 'seconds' ? 'bg-accent' : 'bg-surface'}`}
            onPress={() => setRepUnit('seconds')}
            disabled={isPending}
          >
            <Text className={`text-[9px] font-bold tracking-[2px] ${repUnit === 'seconds' ? 'text-accent-fg' : 'text-muted'}`}>SECONDS</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">TARGET WEIGHT (KG)</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-lg font-bold tracking-tight mb-5"
          placeholder="80"
          placeholderTextColor={c.elevated}
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">YOUTUBE URL</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-sm mb-5"
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor={c.elevated}
          value={form.videoUrl}
          onChangeText={updateField('videoUrl')}
          keyboardType="url"
          autoCapitalize="none"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">NOTES</Text>
        <TextInput
          className="bg-surface rounded px-4 py-3 text-primary text-sm mb-6"
          placeholder="Cues, form tips..."
          placeholderTextColor={c.elevated}
          value={form.description}
          onChangeText={updateField('description')}
          multiline
          numberOfLines={3}
          keyboardAppearance="dark"
          editable={!isPending}
          style={{ textAlignVertical: 'top', minHeight: 80 }}
        />

        <TouchableOpacity
          className={`bg-accent rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={handleCreate}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isPending ? 'ADDING...' : 'ADD EXERCISE'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
