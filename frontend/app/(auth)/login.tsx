import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/errorHandler';

type FieldErrors = { username?: string; password?: string; general?: string };

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const handleLogin = async () => {
        const newErrors: FieldErrors = {};
        if (!username) newErrors.username = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        if (newErrors.username || newErrors.password) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        try {
            setLoading(true);

            const response = await authApi.login({ username, password });

            setUser(response);

            router.replace('/(tabs)');

        } catch (error: unknown) {
            // Backend responds 401 "Invalid username or password" on bad credentials
            setErrors({ general: getErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-[#0e0e0e]">
            <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">WELCOME BACK</Text>
            <Text className="text-[#f5f5f5] text-[40px] font-bold tracking-tighter leading-[44px] mb-10">
                SIGN{'\n'}IN
            </Text>

            <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">USERNAME</Text>
            <TextInput
                className={`bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight ${errors.username ? 'mb-2' : 'mb-4'}`}
                placeholder="Enter username"
                placeholderTextColor="#2a2a2a"
                value={username}
                onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username || errors.general) setErrors({ ...errors, username: undefined, general: undefined });
                }}
                autoCapitalize="none"
                keyboardAppearance="dark"
                editable={!loading}
            />
            {errors.username && (
                <Text className="text-[#ff734a] text-[9px] tracking-[2px] mb-4">
                    {errors.username.toUpperCase()}
                </Text>
            )}

            <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">PASSWORD</Text>
            <TextInput
                className={`bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight ${errors.password ? 'mb-2' : 'mb-8'}`}
                placeholder="Enter password"
                placeholderTextColor="#2a2a2a"
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password || errors.general) setErrors({ ...errors, password: undefined, general: undefined });
                }}
                secureTextEntry
                keyboardAppearance="dark"
                editable={!loading}
            />
            {errors.password && (
                <Text className="text-[#ff734a] text-[9px] tracking-[2px] mb-8">
                    {errors.password.toUpperCase()}
                </Text>
            )}

            {errors.general && (
                <View className="bg-[#2a1410] rounded px-4 py-3 mb-4">
                    <Text className="text-[#ff734a] text-[10px] tracking-[2px] text-center">
                        {errors.general.toUpperCase()}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                className={`bg-[#cafd00] rounded-md py-5 items-center ${loading ? 'opacity-50' : ''}`}
                style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
            >
                <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
                    {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </Text>
            </TouchableOpacity>

            <Link href="/register" asChild>
                <TouchableOpacity className="mt-6 items-center" disabled={loading}>
                    <Text className="text-[#7a7a7a] text-[10px] tracking-[2px]">
                        NO ACCOUNT? <Text className="text-[#cafd00]">REGISTER</Text>
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
