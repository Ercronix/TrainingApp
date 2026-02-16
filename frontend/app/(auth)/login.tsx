import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Login:', username, password);
        // TODO: API Call später
    };

    return (
        <View className="flex-1 justify-center p-6 bg-white">
            <Text className="text-3xl font-bold text-center mb-12">Training App 🏋️</Text>

            <Text className="text-base text-pink-400-800 mb-2">Username</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <Text className="text-base text-gray-800 mb-2">Password</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4 items-center mt-2"
                onPress={handleLogin}
            >
                <Text className="text-white text-lg font-semibold">Login</Text>
            </TouchableOpacity>

            <Link href="/register" asChild>
                <TouchableOpacity className="mt-4 items-center">
                    <Text className="text-blue-500 text-base">
                        Don't have an account? Register
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
