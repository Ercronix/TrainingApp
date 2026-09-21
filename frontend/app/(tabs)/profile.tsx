import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { confirm } from '@/utils/confirm';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { storage } from '@/services/storage';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';
  const c = useTheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setColorScheme(next);
    await storage.setItem('color-scheme', next);
  };

  const selectTheme = async (id: string) => {
    setThemeId(id);
    await storage.setItem('theme-id', id);
  };

  const handleLogout = () => {
    confirm('Logout', 'Are you sure you want to logout?', async () => {
      await authApi.logout();
      logout();
      router.replace('/login');
    }, 'Logout');
  };

  return (
    <View className="flex-1 bg-base">
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
        <View className="flex-row gap-3">
          {THEMES.map((t) => {
            const preview = isDark ? t.dark : t.light;
            const selected = t.id === themeId;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => selectTheme(t.id)}
                activeOpacity={0.8}
                className="flex-1 items-center gap-2"
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
                  className={`text-[9px] font-bold tracking-widest ${selected ? 'text-accent-text' : 'text-muted'}`}
                  numberOfLines={1}
                >
                  {t.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
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
    </View>
  );
}
