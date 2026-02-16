import { View, Text } from 'react-native';

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-gray-800">
          Training History
        </Text>
      </View>

      {/* Coming Soon */}
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl text-gray-400 mb-2">Coming Soon</Text>
        <Text className="text-sm text-gray-400">
          Your training logs will appear here
        </Text>
      </View>
    </View>
  );
}