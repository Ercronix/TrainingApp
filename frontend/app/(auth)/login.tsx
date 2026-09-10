import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/errorHandler';
import { useThemeColors } from '@/constants/theme';

type FieldErrors = { username?: string; password?: string; general?: string };

export default function LoginScreen() {
  const colors = useThemeColors();
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
        <View className="flex-1 justify-center px-6 bg-canvas dark:bg-canvas-dark">
            <Text className="text-accent dark:text-accent-dark text-[10px] tracking-[4px] mb-1">WELCOME BACK</Text>
            <Text className="text-ink dark:text-ink-dark text-[40px] font-bold tracking-tighter leading-[44px] mb-10">
                SIGN{'\n'}IN
            </Text>

            <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">USERNAME</Text>
            <TextInput
                className={`bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight ${errors.username ? 'mb-2' : 'mb-4'}`}
                placeholder="Enter username"
                placeholderTextColor={colors.inkHint}
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
                <Text className="text-danger dark:text-danger-dark text-[9px] tracking-[2px] mb-4">
                    {errors.username.toUpperCase()}
                </Text>
            )}

            <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">PASSWORD</Text>
            <TextInput
                className={`bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight ${errors.password ? 'mb-2' : 'mb-8'}`}
                placeholder="Enter password"
                placeholderTextColor={colors.inkHint}
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
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
            >
                <Text className="text-accent-ink text-sm font-bold tracking-[2px]">
                    {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </Text>
            </TouchableOpacity>

            <Link href="/register" asChild>
                <TouchableOpacity className="mt-6 items-center" disabled={loading}>
                    <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[2px]">
                        NO ACCOUNT? <Text className="text-accent dark:text-accent-dark">REGISTER</Text>
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
