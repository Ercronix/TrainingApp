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