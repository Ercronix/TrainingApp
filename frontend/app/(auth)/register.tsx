import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { authApi } from '@/services/api';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);

            // API Call
            await authApi.register({ username, email, password });

            // Success!
            Alert.alert(
                'Success',
                'Account created! Please login.',
                [
                    { text: 'OK', onPress: () => router.push('/login') }
                ]
            );

        } catch (error: any) {
            console.error('Register error:', error);
            Alert.alert(
                'Registration Failed',
                error.response?.data || 'Please try again'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="flex-1 justify-center px-6 py-12">
                <Text className="text-3xl font-bold text-center mb-12">
                    Create Account
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

                <Text className="text-base mb-2 text-gray-700">Email</Text>
                <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
                    placeholder="Enter email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                />

                <Text className="text-base mb-2 text-gray-700">Password</Text>
                <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
                    placeholder="Enter password (min 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                />

                <TouchableOpacity
                    className={`bg-blue-500 rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text className="text-white text-lg font-semibold">
                        {loading ? 'Creating Account...' : 'Register'}
                    </Text>
                </TouchableOpacity>

                <Link href="/login" asChild>
                    <TouchableOpacity className="mt-4 items-center" disabled={loading}>
                        <Text className="text-blue-500 text-base">
                            Already have an account? Login
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}