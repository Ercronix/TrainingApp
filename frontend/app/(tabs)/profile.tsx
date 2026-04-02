import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { confirm } from '@/utils/confirm';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
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
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">ACCOUNT</Text>
        <Text className="text-[#f5f5f5] text-[44px] font-bold tracking-tighter">PROFILE</Text>
      </View>

      {/* Avatar card */}
      <View className="mx-4 mb-3 bg-[#131313] rounded-md p-8 items-center">
        <View className="w-20 h-20 rounded-full bg-[#cafd00] items-center justify-center mb-4">
          <Text className="text-[#0e0e0e] text-[36px] font-bold tracking-tighter leading-10">
            {(user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text className="text-[#f5f5f5] text-2xl font-bold tracking-tight mb-1">
          {user?.username || 'Athlete'}
        </Text>
        <Text className="text-[#7a7a7a] text-sm">{user?.email || 'N/A'}</Text>
      </View>

      {/* Info rows */}
      <View className="mx-4 mb-3 bg-[#131313] rounded-md px-5">
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={16} color="#7a7a7a" />
            <Text className="text-[#7a7a7a] text-[10px] tracking-[2px]">USERNAME</Text>
          </View>
          <Text className="text-[#f5f5f5] text-sm font-bold">{user?.username || '—'}</Text>
        </View>
        <View className="h-px bg-[#1a1a1a]" />
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="mail-outline" size={16} color="#7a7a7a" />
            <Text className="text-[#7a7a7a] text-[10px] tracking-[2px]">EMAIL</Text>
          </View>
          <Text className="text-[#f5f5f5] text-sm font-bold">{user?.email || '—'}</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="mx-4 bg-[#131313] rounded-md py-5 flex-row items-center justify-center gap-2"
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color="#ff734a" />
        <Text className="text-[#ff734a] text-sm font-bold tracking-[2px]">LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}
