import axios from "axios";
import { storage } from "./storage";
import { LoginRequest, RegisterRequest, AuthResponse, TrainingSplit, Workout, Exercise, TrainingLog, ExerciseLog, CreateExerciseRequest, UpdateExerciseLogRequest } from "@/types";
import { Platform } from "react-native";
// api.ts

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8080/api"
    : "http://10.39.1.24:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Token automatisch hinzufügen
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    if (response.data.token) {
      await storage.setItem("authToken", response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<string> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  logout: async () => {
    await storage.removeItem("authToken");
  },

  me: async (): Promise<AuthResponse> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
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

  update: async (id: number, name: string): Promise<TrainingSplit> => {
    const response = await api.put(`/splits/${id}`, { name });
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

  getProgress: async (exerciseId: number): Promise<unknown> => {
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
