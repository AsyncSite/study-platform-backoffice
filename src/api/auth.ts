import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

const AUTH_API_URL = 'https://api.asyncsite.com/api/auth';

// Create a separate axios instance for auth to avoid circular dependencies
const authClient = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await authClient.post<LoginResponse>('/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Verify token validity
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      const response = await authClient.get('/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};