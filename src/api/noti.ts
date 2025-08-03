import { request } from './client';
import type { 
  ApiResponse, 
} from '../types/api';

const NOTI_API_PATH = '/api/noti/settings/';

export interface NotiSetting {
  userId: string;
  studyUpdates: boolean;
  marketing: boolean;
  emailEnabled: boolean;
  discordEnabled: boolean;
  pushEnabled: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationSettingsRequest {
  studyUpdates: boolean;
  marketing: boolean;
  emailEnabled: boolean;
  discordEnabled: boolean;
  pushEnabled: boolean;
}

// Study API methods
export const notiApi = {
  // Create a new study proposal
  getNotiSetting: async (userId: string): Promise<ApiResponse<NotiSetting>> => {
    return request<NotiSetting>({
      method: 'POST',
      url: `${NOTI_API_PATH}/${userId}`,
    });
  },

  // Approve a study (admin only)
  updateNotiSetting: async (userId: string, data: UpdateNotificationSettingsRequest): Promise<ApiResponse<NotiSetting>> => {
    return request<NotiSetting>({
      method: 'PUT',
      url: `${NOTI_API_PATH}/${userId}`,
      data
    });
  },
};