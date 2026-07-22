import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/errorHandler';

type FieldErrors = { username?: string; email?: string; password?: string; general?: string };

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const handleRegister = async () => {
        // Client-side hints mirroring the backend's validation rules
        const newErrors: FieldErrors = {};
        if (!username) newErrors.username = 'Username is required';
        else if (username.length < 3) newErrors.username = 'Min. 3 characters';
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Min. 6 characters';

        if (newErrors.username || newErrors.email || newErrors.password) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        try {
            setLoading(true);

            const response = await authApi.register({ username, email, password });

            setUser(response);

            router.replace('/(tabs)');

        } catch (error: unknown) {
            // Backend responds 409 "Username is already taken" / "Email is already in use"
            const message = getErrorMessage(error);
            const lower = message.toLowerCase();
            if (lower.includes('username')) setErrors({ username: message });
            else if (lower.includes('email')) setErrors({ email: message });
            else setErrors({ general: message });
        } finally {
            setLoading(false);
        }
    };

    const clearError = (field: keyof FieldErrors) => {
        if (errors[field] || errors.general) setErrors({ ...errors, [field]: undefined, general: undefined });
    };

    return (
        <ScrollView className="flex-1 bg-[#0e0e0e]">
            <View className="flex-1 justify-center px-6 py-16">
                <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">GET STARTED</Text>
                <Text className="text-[#f5f5f5] text-[40px] font-bold tracking-tighter leading-[44px] mb-10">
                    CREATE{'\n'}ACCOUNT
                </Text>

                <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">USERNAME</Text>
                <TextInput
                    className={`bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight ${errors.username ? 'mb-2' : 'mb-4'}`}
                    placeholder="Enter username"
                    placeholderTextColor="#2a2a2a"
                    value={username}
                    onChangeText={(text) => {
                        setUsername(text);
                        clearError('username');
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

                <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">EMAIL</Text>
                <TextInput
                    className={`bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight ${errors.email ? 'mb-2' : 'mb-4'}`}
                    placeholder="Enter email"
                    placeholderTextColor="#2a2a2a"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        clearError('email');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    keyboardAppearance="dark"
                    editable={!loading}
                />
                {errors.email && (
                    <Text className="text-[#ff734a] text-[9px] tracking-[2px] mb-4">
                        {errors.email.toUpperCase()}
                    </Text>
                )}

                <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">PASSWORD</Text>
                <TextInput
                    className={`bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight ${errors.password ? 'mb-2' : 'mb-8'}`}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#2a2a2a"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        clearError('password');
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
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
                        {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                    </Text>
                </TouchableOpacity>

                <Link href="/login" asChild>
                    <TouchableOpacity className="mt-6 items-center" disabled={loading}>
                        <Text className="text-[#7a7a7a] text-[10px] tracking-[2px]">
                            HAVE AN ACCOUNT? <Text className="text-[#cafd00]">SIGN IN</Text>
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}
