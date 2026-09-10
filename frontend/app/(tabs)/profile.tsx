import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { confirm } from '@/utils/confirm';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/theme';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    confirm('Logout', 'Are you sure you want to logout?', async () => {
      await authApi.logout();
      logout();
      router.replace('/login');
    }, 'Logout');
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-accent dark:text-accent-dark text-[10px] tracking-[4px] mb-1">ACCOUNT</Text>
        <Text className="text-ink dark:text-ink-dark text-[44px] font-bold tracking-tighter">PROFILE</Text>
      </View>

      {/* Avatar card */}
      <View className="mx-4 mb-3 bg-surface dark:bg-surface-dark rounded-md p-8 items-center">
        <View className="w-20 h-20 rounded-full bg-accent-solid items-center justify-center mb-4">
          <Text className="text-accent-ink text-[36px] font-bold tracking-tighter leading-10">
            {(user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text className="text-ink dark:text-ink-dark text-2xl font-bold tracking-tight mb-1">
          {user?.username || 'Athlete'}
        </Text>
        <Text className="text-ink-muted dark:text-ink-muted-dark text-sm">{user?.email || 'N/A'}</Text>
      </View>

      {/* Info rows */}
      <View className="mx-4 mb-3 bg-surface dark:bg-surface-dark rounded-md px-5">
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={16} color={colors.inkMuted} />
            <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[2px]">USERNAME</Text>
          </View>
          <Text className="text-ink dark:text-ink-dark text-sm font-bold">{user?.username || '—'}</Text>
        </View>
        <View className="h-px bg-surface-2 dark:bg-surface-2-dark" />
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="mail-outline" size={16} color={colors.inkMuted} />
            <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[2px]">EMAIL</Text>
          </View>
          <Text className="text-ink dark:text-ink-dark text-sm font-bold">{user?.email || '—'}</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="mx-4 bg-surface dark:bg-surface-dark rounded-md py-5 flex-row items-center justify-center gap-2"
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text className="text-danger dark:text-danger-dark text-sm font-bold tracking-[2px]">LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}
