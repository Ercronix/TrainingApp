import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { confirm } from '@/utils/confirm';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    confirm(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        await authApi.logout();
        logout();
        router.replace('/login');
      },
      'Logout'
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-gray-800">Profile</Text>
      </View>

      {/* User Info */}
      <View className="bg-white m-4 rounded-xl p-6">
        <Text className="text-sm text-gray-500 mb-1">Username</Text>
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          {user?.username || 'User'}
        </Text>

        <Text className="text-sm text-gray-500 mb-1">Email</Text>
        <Text className="text-lg font-semibold text-gray-800">
          {user?.email || 'N/A'}
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-500 mx-4 rounded-xl py-4 items-center"
        onPress={handleLogout}
      >
        <Text className="text-white text-lg font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}