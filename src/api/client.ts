import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api';

import { env } from '../config/environment';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 403 Forbidden - User doesn't have permission
    if (error.response?.status === 403) {
      const event = new CustomEvent('auth:forbidden', { 
        detail: { message: '권한이 없습니다. 관리자에게 문의하세요.' }
      });
      window.dispatchEvent(event);
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Token invalid or expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${env.authApiUrl}/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('authToken', accessToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, show notification and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          const event = new CustomEvent('auth:expired', { 
            detail: { message: '세션이 만료되었습니다. 다시 로그인해주세요.' }
          });
          window.dispatchEvent(event);
          
          // Don't retry the request
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, notify and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        const event = new CustomEvent('auth:expired', { 
          detail: { message: '인증이 필요합니다. 로그인 페이지로 이동합니다.' }
        });
        window.dispatchEvent(event);
        
        // Don't retry the request
        return Promise.reject(error);
      }
    }
    
    // For other errors, check if it's a network error that might indicate session issues
    if (!error.response && error.message === 'Network Error') {
      console.error('Network error detected, might be a session issue');
    }
    
    return Promise.reject(error);
  }
);

// Generic request method
export const request = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;