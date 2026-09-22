import { View, Text, TouchableOpacity, Switch, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { confirm, alert } from '@/utils/confirm';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { storage } from '@/services/storage';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { isValidHex } from '@/utils/color';

const ACCENT_SWATCHES = [
  '#f38ba8', // rose
  '#fab387', // peach
  '#f9e2af', // yellow
  '#a6e3a1', // green
  '#94e2d5', // teal
  '#89b4fa', // blue
  '#cba6f7', // mauve
  '#f5c2e7', // pink
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';
  const c = useTheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const customAccent = useThemeStore((s) => s.customAccent);
  const setCustomAccent = useThemeStore((s) => s.setCustomAccent);
  const [accentInput, setAccentInput] = useState(customAccent ?? '');

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setColorScheme(next);
    await storage.setItem('color-scheme', next);
  };

  const selectTheme = async (id: string) => {
    setThemeId(id);
    await storage.setItem('theme-id', id);
  };

  const applyCustomAccent = async (hex: string) => {
    if (!isValidHex(hex)) {
      alert('Invalid color', 'Enter a 6-digit hex code, e.g. #ff6188');
      return;
    }
    setCustomAccent(hex);
    setAccentInput(hex);
    await storage.setItem('custom-accent', hex);
  };

  const resetAccent = async () => {
    setCustomAccent(null);
    setAccentInput('');
    await storage.removeItem('custom-accent');
  };

  const handleLogout = () => {
    confirm('Logout', 'Are you sure you want to logout?', async () => {
      await authApi.logout();
      logout();
      router.replace('/login');
    }, 'Logout');
  };

  return (
    <ScrollView className="flex-1 bg-base" contentContainerStyle={{ paddingBottom: 140 }}>
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">ACCOUNT</Text>
        <Text className="text-primary text-[44px] font-bold tracking-tighter">PROFILE</Text>
      </View>

      {/* Avatar card */}
      <View className="mx-4 mb-3 bg-surface rounded-md p-8 items-center">
        <View className="w-20 h-20 rounded-full bg-accent items-center justify-center mb-4">
          <Text className="text-accent-fg text-[36px] font-bold tracking-tighter leading-10">
            {(user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text className="text-primary text-2xl font-bold tracking-tight mb-1">
          {user?.username || 'Athlete'}
        </Text>
        <Text className="text-muted text-sm">{user?.email || 'N/A'}</Text>
      </View>

      {/* Info rows */}
      <View className="mx-4 mb-3 bg-surface rounded-md px-5">
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={16} color={c.muted} />
            <Text className="text-muted text-[10px] tracking-[2px]">USERNAME</Text>
          </View>
          <Text className="text-primary text-sm font-bold">{user?.username || '—'}</Text>
        </View>
        <View className="h-px bg-elevated" />
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="mail-outline" size={16} color={c.muted} />
            <Text className="text-muted text-[10px] tracking-[2px]">EMAIL</Text>
          </View>
          <Text className="text-primary text-sm font-bold">{user?.email || '—'}</Text>
        </View>
        <View className="h-px bg-elevated" />
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="moon-outline" size={16} color={c.muted} />
            <Text className="text-muted text-[10px] tracking-[2px]">DARK MODE</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: c.elevated, true: c.accent }}
            thumbColor={isDark ? c.accentFg : c.muted}
          />
        </View>
      </View>

      {/* Theme picker */}
      <View className="mx-4 mb-3 bg-surface rounded-md p-5">
        <Text className="text-muted text-[10px] tracking-[3px] mb-4">THEME</Text>
        <View className="flex-row flex-wrap gap-4">
          {THEMES.map((t) => {
            const preview = isDark ? t.dark : t.light;
            const selected = t.id === themeId;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => selectTheme(t.id)}
                activeOpacity={0.8}
                style={{ width: 68 }}
                className="items-center gap-2"
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: preview.base,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? preview.accent : c.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: preview.accent }} />
                </View>
                <Text
                  className={`text-[8px] font-bold text-center ${selected ? 'text-accent-text' : 'text-muted'}`}
                  numberOfLines={1}
                >
                  {t.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Accent picker */}
      <View className="mx-4 mb-3 bg-surface rounded-md p-5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-muted text-[10px] tracking-[3px]">ACCENT</Text>
          {customAccent && (
            <TouchableOpacity onPress={resetAccent} activeOpacity={0.7}>
              <Text className="text-muted text-[9px] tracking-widest">RESET TO THEME</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {ACCENT_SWATCHES.map((hex) => (
            <TouchableOpacity key={hex} onPress={() => applyCustomAccent(hex)} activeOpacity={0.8}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: hex,
                  borderWidth: customAccent === hex ? 2 : 0,
                  borderColor: c.primary,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isValidHex(accentInput) ? accentInput : c.elevated,
              borderWidth: 1,
              borderColor: c.elevated,
            }}
          />
          <TextInput
            value={accentInput}
            onChangeText={setAccentInput}
            placeholder="#ff6188"
            placeholderTextColor={c.subtle}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
            className="flex-1 bg-base rounded-sm px-3 py-2.5 text-primary text-sm"
            onSubmitEditing={() => applyCustomAccent(accentInput)}
          />
          <TouchableOpacity
            onPress={() => applyCustomAccent(accentInput)}
            activeOpacity={0.85}
            className="bg-accent px-4 py-2.5 rounded-sm"
          >
            <Text className="text-accent-fg text-[10px] font-bold tracking-widest">SET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="mx-4 bg-surface rounded-md py-5 flex-row items-center justify-center gap-2"
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={c.danger} />
        <Text className="text-danger text-sm font-bold tracking-[2px]">LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
