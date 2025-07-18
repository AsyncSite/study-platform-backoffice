// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    username: string;
    email: string;
    roles: string[];
  };
  message?: string;
  error?: any;
  timestamp?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name?: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  USER: 'USER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}