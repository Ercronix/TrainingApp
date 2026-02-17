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

// Workouts API
export const workoutsApi = {
  getBySplit: async (splitId: number) => {
    const response = await api.get(`/workouts/split/${splitId}`);
    return response.data;
  },

  create: async (splitId: number, data: any) => {
    const response = await api.post(`/workouts/split/${splitId}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/workouts/${id}`);
  },
};

// Training Logs API
export const trainingLogsApi = {
  start: async (splitId: number) => {
    const response = await api.post('/training-logs/start', { splitId });
    return response.data;
  },

  updateExercise: async (exerciseLogId: number, data: any) => {
    const response = await api.put(`/training-logs/exercises/${exerciseLogId}`, data);
    return response.data;
  },

  complete: async (id: number, notes?: string) => {
    const response = await api.put(`/training-logs/${id}/complete`, { notes });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/training-logs');
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/training-logs/active');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/training-logs/${id}`);
    return response.data;
  },
};

export default api;