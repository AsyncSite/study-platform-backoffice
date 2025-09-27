import { request } from './client';
import type {
  ApiResponse,
  PageResponse
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

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SCHEDULED'
  | 'CANCELLED';

export type ChannelType =
  | 'EMAIL'
  | 'DISCORD'
  | 'PUSH';

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  templateId: string;
  channelType: ChannelType;
  title: string;
  content: string;
  recipientContacts: string[];
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  failMessage?: string;
  retryCount: number;
  scheduledAt?: string;
  version: number;
}

export interface NotificationSearchCriteria {
  userId?: string;
  statuses?: string;
  templateId?: string;
  channelTypes?: string;
  startDate?: string;
  endDate?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  keyword?: string;
  hasFailMessage?: boolean;
}

export interface NotiTemplate {
  templateId: string;
  channelType: string;
  eventType: string;
  titleTemplate: string;
  contentTemplate: string;
  variables: Record<string, string>;
  active: boolean;
  isDefault: boolean;
  priority: number;
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

  setDefaultTemplate: async (templateId: string): Promise<ApiResponse<void>> => {
    return request<void>({
      method: 'PATCH',
      url: `${NOTI_API_PATH}/templates/${templateId}/default`,
    });
  },

  updateTemplatePriority: async (templateId: string, value: number): Promise<ApiResponse<void>> => {
    return request<void>({
      method: 'PATCH',
      url: `${NOTI_API_PATH}/templates/${templateId}/priority`,
      params: { value }
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

  // Notification Dashboard APIs
  getAllNotifications: async (page = 0, size = 20): Promise<ApiResponse<PageResponse<NotificationResponse>>> => {
    return request<PageResponse<NotificationResponse>>({
      method: 'GET',
      url: `${NOTI_API_PATH}/admin/all`,
      params: { page, size }
    });
  },

  searchNotifications: async (
    criteria: NotificationSearchCriteria,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<NotificationResponse>>> => {
    return request<PageResponse<NotificationResponse>>({
      method: 'GET',
      url: `${NOTI_API_PATH}/admin/search`,
      params: {
        ...criteria,
        page,
        size
      }
    });
  },

  retryNotification: async (notificationId: string): Promise<ApiResponse<NotificationResponse>> => {
    return request<NotificationResponse>({
      method: 'PATCH',
      url: `${NOTI_API_PATH}/${notificationId}/retry`
    });
  },

  cancelNotification: async (notificationId: string): Promise<ApiResponse<NotificationResponse>> => {
    return request<NotificationResponse>({
      method: 'PATCH',
      url: `${NOTI_API_PATH}/${notificationId}/cancel`
    });
  },
  getNotificationPreview: async (notificationId: string): Promise<ApiResponse<{ htmlContent: string }>> => {
    return request<{ htmlContent: string }>({
      method: 'GET',
      url: `${NOTI_API_PATH}/${notificationId}/preview`
    });
  }
};
