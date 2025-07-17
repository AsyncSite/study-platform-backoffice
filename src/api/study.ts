import { request } from './client';
import type { 
  ApiResponse, 
  StudyCreateRequest, 
  StudyResponse, 
  Page, 
  PageRequest 
} from '../types/api';

const STUDY_API_PATH = '/api/studies';

// Study API methods
export const studyApi = {
  // Create a new study proposal
  create: async (data: StudyCreateRequest): Promise<ApiResponse<StudyResponse>> => {
    return request<StudyResponse>({
      method: 'POST',
      url: STUDY_API_PATH,
      data,
    });
  },

  // Approve a study (admin only)
  approve: async (studyId: string): Promise<ApiResponse<StudyResponse>> => {
    return request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/approve`,
    });
  },

  // Reject a study (admin only)
  reject: async (studyId: string): Promise<ApiResponse<StudyResponse>> => {
    return request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/reject`,
    });
  },

  // Terminate a study
  terminate: async (studyId: string): Promise<ApiResponse<StudyResponse>> => {
    return request<StudyResponse>({
      method: 'DELETE',
      url: `${STUDY_API_PATH}/${studyId}`,
    });
  },

  // Get all studies
  getAll: async (): Promise<ApiResponse<StudyResponse[]>> => {
    return request<StudyResponse[]>({
      method: 'GET',
      url: STUDY_API_PATH,
    });
  },

  // Get paginated studies
  getPaged: async (params?: PageRequest): Promise<ApiResponse<Page<StudyResponse>>> => {
    return request<Page<StudyResponse>>({
      method: 'GET',
      url: `${STUDY_API_PATH}/paged`,
      params,
    });
  },

  // Get study by ID
  getById: async (studyId: string): Promise<ApiResponse<StudyResponse>> => {
    return request<StudyResponse>({
      method: 'GET',
      url: `${STUDY_API_PATH}/${studyId}`,
    });
  },
};