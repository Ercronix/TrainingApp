import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);

            const response = await authApi.login({ username, password });

            setUser(response);

            router.replace('/(tabs)');

        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert(
                'Login Failed',
                error.response?.data || 'Invalid username or password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-3xl font-bold text-center mb-12">
                Training App 🏋️
            </Text>

            <Text className="text-base mb-2 text-gray-700">Username</Text>
            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
            />

            <Text className="text-base mb-2 text-gray-700">Password</Text>
            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
            />

            <TouchableOpacity
                className={`bg-blue-500 rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text className="text-white text-lg font-semibold">
                    {loading ? 'Logging in...' : 'Login'}
                </Text>
            </TouchableOpacity>

            <Link href="/register" asChild>
                <TouchableOpacity className="mt-4 items-center" disabled={loading}>
                    <Text className="text-blue-500 text-base">
                        Don't have an account? Register
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}