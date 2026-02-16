import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor - Token automatisch hinzufügen
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', data);
        if (response.data.token) {
            await SecureStore.setItemAsync('authToken', response.data.token);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<string> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('authToken');
    },
};

export default api;