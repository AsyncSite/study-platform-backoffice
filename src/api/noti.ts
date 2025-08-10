import { request } from './client';
import type {
  ApiResponse,
} from '../types/api';

const NOTI_API_PATH = '/api/noti';

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

export interface NotiTemplate {
  templateId: string;
  channelType: string;
  eventType: string;
  titleTemplate: string;
  contentTemplate: string;
  variables: Record<string, string>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotiTemplateRequest {
  channelType: string;
  eventType: string;
  titleTemplate: string;
  contentTemplate: string;
  variables: Record<string, string>;
}

export interface UpdateNotificationSettingsRequest {
  studyUpdates: boolean;
  marketing: boolean;
  emailEnabled: boolean;
  discordEnabled: boolean;
  pushEnabled: boolean;
}

export interface UpdateNotiTemplateRequest {
  titleTemplate: string;
  contentTemplate: string;
  variables: Record<string, string>;
}

// Study API methods
export const notiApi = {
  // Create a new study proposal
  getNotiSetting: async (userId: string): Promise<ApiResponse<NotiSetting>> => {
    return request<NotiSetting>({
      method: 'GET',
      url: `${NOTI_API_PATH}/settings/${userId}`,
    });
  },

  // Approve a study (admin only)
  updateNotiSetting: async (userId: string, data: UpdateNotificationSettingsRequest): Promise<ApiResponse<NotiSetting>> => {
    return request<NotiSetting>({
      method: 'PUT',
      url: `${NOTI_API_PATH}/settings/${userId}`,
      data
    });
  },

  getNotiTemplates: async (channelType: string): Promise<ApiResponse<NotiTemplate[]>> => {
    return request<NotiTemplate[]>({
      method: 'GET',
      url: `${NOTI_API_PATH}/templates`,
      params: {
        channelType,
      },
    });
  },

  getNotiTemplate: async (templateId: string): Promise<ApiResponse<NotiTemplate>> => {
    return request<NotiTemplate>({
      method: 'GET',
      url: `${NOTI_API_PATH}/templates/${templateId}`,
    });
  },

  createNotiTemplate: async (data: CreateNotiTemplateRequest): Promise<ApiResponse<NotiTemplate>> => {
    return request<NotiTemplate>({
      method: 'POST',
      url: `${NOTI_API_PATH}/templates`,
      data,
    });
  },

  updateNotiTemplate: async (templateId: string, data: UpdateNotiTemplateRequest): Promise<ApiResponse<NotiTemplate>> => {
    return request<NotiTemplate>({
      method: 'PUT',
      url: `${NOTI_API_PATH}/templates/${templateId}`,
      data,
    });
  },

  deactivateNotiTemplate: async (templateId: string): Promise<ApiResponse<void>> => {
    return request<void>({
      method: 'PATCH',
      url: `${NOTI_API_PATH}/templates/${templateId}/deactivate`,
    });
  },


  getEventTypes: async (): Promise<ApiResponse<string[]>> => {
    return request<string[]>({
      method: 'GET',
      url: `${NOTI_API_PATH}/event-types`,
    });
  },

  getChannelTypes: async (): Promise<ApiResponse<string[]>> => {
    return request<string[]>({
      method: 'GET',
      url: `${NOTI_API_PATH}/channel-types`,
    });
  },
};
