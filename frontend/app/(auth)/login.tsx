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
        <View className="flex-1 justify-center px-6 bg-slate-950">
            <Text className="text-3xl font-bold text-slate-100 text-center mb-12">
                Training App 🏋️
            </Text>

            <Text className="text-base mb-2 text-slate-300">Username</Text>
            <TextInput
                className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
                placeholder="Enter username"
                placeholderTextColor="#64748B"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardAppearance="dark"
                editable={!loading}
            />

            <Text className="text-base mb-2 text-slate-300">Password</Text>
            <TextInput
                className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
                placeholder="Enter password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                keyboardAppearance="dark"
                editable={!loading}
            />

            <TouchableOpacity
                className={`bg-blue-600 rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text className="text-white text-lg font-semibold">
                    {loading ? 'Logging in...' : 'Login'}
                </Text>
            </TouchableOpacity>

            <Link href="/register" asChild>
                <TouchableOpacity className="mt-4 items-center" disabled={loading}>
                    <Text className="text-blue-400 text-base">
                        Don't have an account? Register
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
