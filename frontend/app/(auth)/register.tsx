import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        console.log('Register:', username, email, password);
        // TODO: API Call später
    };

    return (
        <View className="flex-1 justify-center p-6 bg-white">
            <Text className="text-3xl font-bold text-center mb-12">Create Account</Text>

            <Text className="text-base text-gray-800 mb-2">Username</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <Text className="text-base text-gray-800 mb-2">Email</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <Text className="text-base text-gray-800 mb-2">Password</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4 items-center mt-2"
                onPress={handleRegister}
            >
                <Text className="text-white text-lg font-semibold">Register</Text>
            </TouchableOpacity>
        </View>
    );
}
