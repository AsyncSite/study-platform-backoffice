import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';
import { env } from '../config/environment';

// Use environment-specific auth API URL
const AUTH_API_URL = env.authApiUrl;

// Create a separate axios instance for auth to avoid circular dependencies
const authClient = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API implementation
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await authClient.post<LoginResponse>('/login', credentials);
      
      // Store refresh token if provided
      if (response.data.success && response.data.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
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

  // Verify token validity (deprecated - not used anymore)
  verifyToken: async (): Promise<boolean> => {
    // Token verification is now handled by actual API calls
    // If token is invalid, 401 will be returned and handled by axios interceptor
    return true;
  },
};