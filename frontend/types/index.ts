export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    userId: number;
    username: string;
    email: string;
}

// User Type
export interface User {
    id: number;
    username: string;
    email: string;
}

// Training Split Types
export interface TrainingSplit {
    id: number;
    name: string;
    isActive: boolean;
    workoutCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSplitRequest {
    name: string;
}