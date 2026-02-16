import axios from 'axios';
import { storage } from './storage';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

const API_URL = 'http://192.168.2.150:8080/api';


const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor - Token automatisch hinzufügen
api.interceptors.request.use(
  async (config) => {
      const token = await storage.getItem('authToken');
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  },
  (error) => Promise.reject(error)
);


export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', data);
        if (response.data.token) {
            await storage.setItem('authToken', response.data.token);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<string> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    logout: async () => {
        await storage.removeItem('authToken');
    },
};

export const splitsApi = {
  getAll: async () => {
    const response = await api.get('/splits');
    return response.data;
  },

  create: async (name: string) => {
    const response = await api.post('/splits', { name });
    return response.data;
  },

  activate: async (id: number) => {
    const response = await api.put(`/splits/${id}/activate`);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/splits/${id}`);
  },
};

export default api;