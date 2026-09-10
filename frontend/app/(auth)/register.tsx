import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/errorHandler';
import { useThemeColors } from '@/constants/theme';

type FieldErrors = { username?: string; email?: string; password?: string; general?: string };

export default function RegisterScreen() {
  const colors = useThemeColors();
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
        <ScrollView className="flex-1 bg-canvas dark:bg-canvas-dark">
            <View className="flex-1 justify-center px-6 py-16">
                <Text className="text-accent dark:text-accent-dark text-[10px] tracking-[4px] mb-1">GET STARTED</Text>
                <Text className="text-ink dark:text-ink-dark text-[40px] font-bold tracking-tighter leading-[44px] mb-10">
                    CREATE{'\n'}ACCOUNT
                </Text>

                <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">USERNAME</Text>
                <TextInput
                    className={`bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight ${errors.username ? 'mb-2' : 'mb-4'}`}
                    placeholder="Enter username"
                    placeholderTextColor={colors.inkHint}
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
                    <Text className="text-danger dark:text-danger-dark text-[9px] tracking-[2px] mb-4">
                        {errors.username.toUpperCase()}
                    </Text>
                )}

                <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">EMAIL</Text>
                <TextInput
                    className={`bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight ${errors.email ? 'mb-2' : 'mb-4'}`}
                    placeholder="Enter email"
                    placeholderTextColor={colors.inkHint}
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
                    <Text className="text-danger dark:text-danger-dark text-[9px] tracking-[2px] mb-4">
                        {errors.email.toUpperCase()}
                    </Text>
                )}

                <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">PASSWORD</Text>
                <TextInput
                    className={`bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight ${errors.password ? 'mb-2' : 'mb-8'}`}
                    placeholder="Min 6 characters"
                    placeholderTextColor={colors.inkHint}
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
                    <Text className="text-danger dark:text-danger-dark text-[9px] tracking-[2px] mb-8">
                        {errors.password.toUpperCase()}
                    </Text>
                )}

                {errors.general && (
                    <View className="bg-surface-danger dark:bg-surface-danger-dark rounded px-4 py-3 mb-4">
                        <Text className="text-danger dark:text-danger-dark text-[10px] tracking-[2px] text-center">
                            {errors.general.toUpperCase()}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    className={`bg-accent-solid rounded-md py-5 items-center ${loading ? 'opacity-50' : ''}`}
                    style={{ shadowColor: colors.accentSolid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text className="text-accent-ink text-sm font-bold tracking-[2px]">
                        {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                    </Text>
                </TouchableOpacity>

                <Link href="/login" asChild>
                    <TouchableOpacity className="mt-6 items-center" disabled={loading}>
                        <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[2px]">
                            HAVE AN ACCOUNT? <Text className="text-accent dark:text-accent-dark">SIGN IN</Text>
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}
