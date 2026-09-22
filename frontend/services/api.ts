import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";
import { LoginRequest, RegisterRequest, AuthResponse, TrainingSplit, Workout, Exercise, TrainingLog, ExerciseLog, CreateExerciseRequest, UpdateExerciseLogRequest, ExerciseProgress } from "@/types";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/authStore";
// api.ts

const API_URL =
  Platform.OS === "web"
    ? (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api")
    : "https://training.timmornhinweg.de/api";

const ACCESS_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate instance without interceptors, so a failing refresh can't recurse
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

async function saveSession(data: AuthResponse) {
  await storage.setItem(ACCESS_TOKEN_KEY, data.token);
  if (data.refreshToken) await storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  // Cached so the app can start while offline
  await storage.setItem(USER_KEY, JSON.stringify({ userId: data.userId, username: data.username, email: data.email }));
}

async function clearSession() {
  await storage.removeItem(ACCESS_TOKEN_KEY);
  await storage.removeItem(REFRESH_TOKEN_KEY);
  await storage.removeItem(USER_KEY);
}

// Concurrent 401s share one refresh request
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const response = await authClient.post<AuthResponse>("/auth/refresh", { refreshToken });
    await saveSession(response.data);
    return response.data.token;
  } catch (error) {
    // Only a rejected token ends the session; network errors keep it for a later retry
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await clearSession();
      useAuthStore.getState().logout();
    }
    return null;
  }
}

// Request Interceptor - Token automatisch hinzufügen
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor - bei abgelaufenem Access Token einmal refreshen und wiederholen
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retried) {
      return Promise.reject(error);
    }
    original._retried = true;

    refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
    const token = await refreshPromise;
    if (!token) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    if (response.data.token) {
      await saveSession(response.data);
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    if (response.data.token) {
      await saveSession(response.data);
    }
    return response.data;
  },

  logout: async () => {
    const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
    await clearSession();
    if (refreshToken) {
      // Best effort: revoke server-side, but never block logout on the network
      authClient.post("/auth/logout", { refreshToken }).catch(() => {});
    }
  },

  me: async (): Promise<AuthResponse> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  hasSession: async (): Promise<boolean> => {
    return !!(await storage.getItem(ACCESS_TOKEN_KEY)) || !!(await storage.getItem(REFRESH_TOKEN_KEY));
  },

  getCachedUser: async (): Promise<Pick<AuthResponse, "userId" | "username" | "email"> | null> => {
    const raw = await storage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearSession,
};

export const splitsApi = {
  getAll: async (): Promise<TrainingSplit[]> => {
    const response = await api.get("/splits");
    return response.data;
  },

  create: async (name: string): Promise<TrainingSplit> => {
    const response = await api.post("/splits", { name });
    return response.data;
  },

  activate: async (id: number): Promise<TrainingSplit> => {
    const response = await api.put(`/splits/${id}/activate`);
    return response.data;
  },

  update: async (id: number, data: { name: string; currentBlock?: number }): Promise<TrainingSplit> => {
    const response = await api.put(`/splits/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/splits/${id}`);
  },
};

// Workouts API — workouts are now just named training days (e.g. "Push Day")
export const workoutsApi = {
  getBySplit: async (splitId: number): Promise<Workout[]> => {
    const response = await api.get(`/workouts/split/${splitId}`);
    return response.data;
  },

  // Only needs a name now — exercises hold sets/reps/weight/video
  create: async (splitId: number, data: { name: string }): Promise<Workout> => {
    const response = await api.post(`/workouts/split/${splitId}`, data);
    return response.data;
  },

  getById: async (id: number): Promise<Workout> => {
    const response = await api.get(`/workouts/${id}`);
    return response.data;
  },

  update: async (id: number, name: string): Promise<Workout> => {
    const response = await api.put(`/workouts/${id}`, { name });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },
};

// Exercises API — exercises belong to a workout and hold sets/reps/weight/video
export const exercisesApi = {
  getByWorkout: async (workoutId: number): Promise<Exercise[]> => {
    const response = await api.get(`/workouts/${workoutId}/exercises`);
    return response.data;
  },

  create: async (workoutId: number, data: CreateExerciseRequest): Promise<Exercise> => {
    const response = await api.post(`/workouts/${workoutId}/exercises`, data);
    return response.data;
  },

  update: async (
    workoutId: number,
    exerciseId: number,
    data: Partial<CreateExerciseRequest> & { orderIndex?: number },
  ): Promise<Exercise> => {
    const response = await api.put(
      `/workouts/${workoutId}/exercises/${exerciseId}`,
      data,
    );
    return response.data;
  },

  reorder: async (workoutId: number, exercises: { id: number; orderIndex: number }[]): Promise<void> => {
    await api.patch(`/workouts/${workoutId}/exercises/reorder`, { exercises });
  },

  delete: async (workoutId: number, exerciseId: number): Promise<void> => {
    await api.delete(`/workouts/${workoutId}/exercises/${exerciseId}`);
  },

  getProgress: async (exerciseId: number): Promise<ExerciseProgress> => {
    const response = await api.get(`/exercises/${exerciseId}/progress`);
    return response.data;
  },
};

// Training Logs API
export const trainingLogsApi = {
  start: async (workoutId: number): Promise<TrainingLog> => {
    const response = await api.post("/training-logs/start", { workoutId });
    return response.data;
  },

  addExerciseLog: async (
    trainingLogId: number,
    data: {
      name: string;
      sets?: number | null;
      reps?: number | null;
      plannedWeight?: number | null;
      addToWorkout: boolean;
    },
  ): Promise<ExerciseLog> => {
    const response = await api.post(
      `/training-logs/${trainingLogId}/exercise-logs`,
      data,
    );
    return response.data;
  },

  // Renamed endpoint: /exercises/ → /exercise-logs/
  updateExerciseLog: async (exerciseLogId: number, data: UpdateExerciseLogRequest): Promise<ExerciseLog> => {
    const response = await api.put(
      `/training-logs/exercise-logs/${exerciseLogId}`,
      data,
    );
    return response.data;
  },

  complete: async (id: number, notes?: string): Promise<TrainingLog> => {
    const response = await api.put(`/training-logs/${id}/complete`, { notes });
    return response.data;
  },

  getAll: async (): Promise<TrainingLog[]> => {
    const response = await api.get("/training-logs");
    return response.data;
  },

  getActive: async (): Promise<TrainingLog | null> => {
    const response = await api.get("/training-logs/active");
    return response.data;
  },

  getById: async (id: number): Promise<TrainingLog> => {
    const response = await api.get(`/training-logs/${id}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/training-logs/${id}`);
  },
};

export default api;
