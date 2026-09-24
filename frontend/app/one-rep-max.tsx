import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { OneRepMaxCalculator } from '@/components/OneRepMaxCalculator';

export default function OneRepMaxScreen() {
  const router = useRouter();
  const c = useTheme();

  return (
    <View className="flex-1 bg-base">
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">TOOLS</Text>
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9">1RM CALCULATOR</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="bg-surface rounded-md p-5">
            <OneRepMaxCalculator />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
