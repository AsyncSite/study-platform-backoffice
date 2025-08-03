import apiClient from './client';
import type {
  User,
  UserDetail,
  UserListRequest,
  UserListResponse,
  UserStatistics,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest
} from '../types/user';
import { env } from '../config/environment';

const USERS_API_URL = `${env.apiBaseUrl}/api/admin/users`;

export const usersApi = {
  // Get user list with pagination and filters
  getUsers: async (params: UserListRequest): Promise<UserListResponse> => {
    const response = await apiClient.get(USERS_API_URL, { params });
    return response.data;
  },

  // Get user detail
  getUserDetail: async (userId: string): Promise<UserDetail> => {
    const response = await apiClient.get(`${USERS_API_URL}/${userId}`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: string, data: UpdateUserRoleRequest): Promise<User> => {
    const response = await apiClient.put(`${USERS_API_URL}/${userId}/role`, data);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId: string, data: UpdateUserStatusRequest): Promise<User> => {
    const response = await apiClient.put(`${USERS_API_URL}/${userId}/status`, data);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (userId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`${USERS_API_URL}/${userId}/reset-password`);
    return response.data;
  },

  // Get user statistics
  getUserStatistics: async (): Promise<UserStatistics> => {
    const response = await apiClient.get(`${USERS_API_URL}/statistics`);
    return response.data;
  },

  // Export users to Excel
  exportUsers: async (params: UserListRequest): Promise<Blob> => {
    const response = await apiClient.get(`${USERS_API_URL}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};