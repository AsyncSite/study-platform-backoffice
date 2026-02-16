import apiClient from './client';
import { env } from '../config/environment';

// Types

export type ResumeRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ResumeStatus = 'GENERATED' | 'DELIVERED' | 'ARCHIVED';
export type ResumeGenerationMode = 'MANUAL' | 'AUTO';

export interface ResumeTemplate {
  id: number;
  name: string;
  description: string | null;
  promptText: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeRequest {
  id: number;
  userName: string;
  userEmail: string | null;
  inputData: string;
  formattedText: string | null;
  status: ResumeRequestStatus;
  templateId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: number;
  requestId: number | null;
  title: string;
  pdfUrl: string | null;
  pdfKey: string | null;
  fileSizeBytes: number;
  svgUrl: string | null;
  svgKey: string | null;
  htmlUrl: string | null;
  htmlKey: string | null;
  generationMode: ResumeGenerationMode;
  status: ResumeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  promptText: string;
}

export interface UpdateTemplateRequest {
  name: string;
  description?: string;
  promptText: string;
}

export interface CreateResumeRequestDto {
  userName: string;
  userEmail?: string;
  inputData: string;
  formattedText?: string;
  templateId?: number;
}

export interface GenerateResumeRequest {
  requestId?: number;
  title: string;
  htmlContent: string;
  mode?: ResumeGenerationMode;
}

const TEMPLATE_URL = '/api/grit-service/grit/resume/templates';
const REQUEST_URL = '/api/grit-service/grit/resume/requests';
const RESUME_URL = '/api/grit-service/grit/resume/resumes';

export const resumeApi = {
  // === Templates ===
  getTemplates: async (activeOnly?: boolean): Promise<ResumeTemplate[]> => {
    const params = activeOnly ? { activeOnly: true } : {};
    const response = await apiClient.get(TEMPLATE_URL, { params });
    return response.data;
  },

  getTemplateById: async (id: number): Promise<ResumeTemplate> => {
    const response = await apiClient.get(`${TEMPLATE_URL}/${id}`);
    return response.data;
  },

  createTemplate: async (request: CreateTemplateRequest): Promise<ResumeTemplate> => {
    const response = await apiClient.post(TEMPLATE_URL, request);
    return response.data;
  },

  updateTemplate: async (id: number, request: UpdateTemplateRequest): Promise<ResumeTemplate> => {
    const response = await apiClient.put(`${TEMPLATE_URL}/${id}`, request);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`${TEMPLATE_URL}/${id}`);
  },

  toggleTemplateActive: async (id: number): Promise<ResumeTemplate> => {
    const response = await apiClient.patch(`${TEMPLATE_URL}/${id}/toggle-active`);
    return response.data;
  },

  // === Requests ===
  getRequests: async (status?: ResumeRequestStatus): Promise<ResumeRequest[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(REQUEST_URL, { params });
    return response.data;
  },

  getRequestById: async (id: number): Promise<ResumeRequest> => {
    const response = await apiClient.get(`${REQUEST_URL}/${id}`);
    return response.data;
  },

  createRequest: async (request: CreateResumeRequestDto): Promise<ResumeRequest> => {
    const response = await apiClient.post(REQUEST_URL, request);
    return response.data;
  },

  changeRequestStatus: async (id: number, status: ResumeRequestStatus): Promise<ResumeRequest> => {
    const response = await apiClient.put(`${REQUEST_URL}/${id}/status`, { status });
    return response.data;
  },

  deleteRequest: async (id: number): Promise<void> => {
    await apiClient.delete(`${REQUEST_URL}/${id}`);
  },

  // === Resumes ===
  getResumesByRequestId: async (requestId: number): Promise<Resume[]> => {
    const response = await apiClient.get(`${RESUME_URL}/by-request/${requestId}`);
    return response.data;
  },

  changeResumeStatus: async (id: number, status: ResumeStatus): Promise<Resume> => {
    const response = await apiClient.put(`${RESUME_URL}/${id}/status`, { status });
    return response.data;
  },

  getResumes: async (): Promise<Resume[]> => {
    const response = await apiClient.get(RESUME_URL);
    return response.data;
  },

  getResumeById: async (id: number): Promise<Resume> => {
    const response = await apiClient.get(`${RESUME_URL}/${id}`);
    return response.data;
  },

  generateResume: async (request: GenerateResumeRequest): Promise<Resume> => {
    const response = await apiClient.post(`${RESUME_URL}/generate`, request, { timeout: 120000 });
    return response.data;
  },

  previewHtml: async (htmlContent: string): Promise<{ htmlContent: string }> => {
    const response = await apiClient.post(`${RESUME_URL}/preview`, { htmlContent }, { timeout: 60000 });
    return response.data;
  },

  deleteResume: async (id: number): Promise<void> => {
    await apiClient.delete(`${RESUME_URL}/${id}`);
  },

  getDownloadUrl: (id: number): string => {
    return `${env.apiBaseUrl}${RESUME_URL}/${id}/download`;
  },

  getHtmlDownloadUrl: (id: number): string => {
    return `${env.apiBaseUrl}${RESUME_URL}/${id}/download-html`;
  },

  // === Auto Generation ===
  getAutoGenerationSetting: async (): Promise<{ enabled: boolean }> => {
    const response = await apiClient.get(`${RESUME_URL}/settings/auto-generation`);
    return response.data;
  },

  setAutoGenerationSetting: async (enabled: boolean): Promise<{ enabled: boolean }> => {
    const response = await apiClient.put(`${RESUME_URL}/settings/auto-generation`, { enabled });
    return response.data;
  },

  autoGenerate: async (requestId: number): Promise<Resume> => {
    const response = await apiClient.post(`${RESUME_URL}/auto-generate`, { requestId }, { timeout: 180000 });
    return response.data;
  },
};
