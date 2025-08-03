import { request } from './client';
import type { 
  ApiResponse, 
  StudyCreateRequest, 
  StudyResponse, 
  StudyRejectRequest,
  Page, 
  PageRequest,
  ApplicationResponse,
  ApplicationRequest,
  AcceptApplicationRequest,
  RejectApplicationRequest
} from '../types/api';

// 게이트웨이를 통한 study-service 접근 경로
const STUDY_API_PATH = '/api/studies/v1/studies';

// Study API methods
export const studyApi = {
  // Create a new study proposal
  createStudy: async (data: StudyCreateRequest): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'POST',
      url: STUDY_API_PATH,
      data,
    });
    return response.data;
  },

  // Approve a study (admin only)
  approveStudy: async (studyId: string): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/approve`,
    });
    return response.data;
  },

  // Reject a study (admin only)
  rejectStudy: async (studyId: string, reason: string): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/reject`,
      data: { reason },
    });
    return response.data;
  },

  // Terminate a study
  terminateStudy: async (studyId: string): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/terminate`,
    });
    return response.data;
  },

  // Reactivate a terminated study
  reactivateStudy: async (studyId: string): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'PATCH',
      url: `${STUDY_API_PATH}/${studyId}/reactivate`,
    });
    return response.data;
  },

  // Delete a study (only for terminated or rejected studies)
  deleteStudy: async (studyId: string): Promise<void> => {
    await request<void>({
      method: 'DELETE',
      url: `${STUDY_API_PATH}/${studyId}`,
    });
  },

  // Get all studies
  getAllStudies: async (): Promise<StudyResponse[]> => {
    const response = await request<StudyResponse[]>({
      method: 'GET',
      url: STUDY_API_PATH,
    });
    return response.data;
  },

  // Get paginated studies - commonly used name
  getPagedStudies: async (page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Promise<Page<StudyResponse>> => {
    const response = await request<Page<StudyResponse>>({
      method: 'GET',
      url: `${STUDY_API_PATH}/paged`,
      params: { page, size, sort },
    });
    return response.data;
  },

  // Get all studies including deleted
  getAllStudiesIncludingDeleted: async (): Promise<StudyResponse[]> => {
    const response = await request<StudyResponse[]>({
      method: 'GET',
      url: `${STUDY_API_PATH}/all-including-deleted`,
    });
    return response.data;
  },

  // Get paginated studies including deleted
  getPagedStudiesIncludingDeleted: async (page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Promise<Page<StudyResponse>> => {
    const response = await request<Page<StudyResponse>>({
      method: 'GET',
      url: `${STUDY_API_PATH}/paged-including-deleted`,
      params: { page, size, sort },
    });
    return response.data;
  },

  // Get study by ID
  getStudyById: async (studyId: string): Promise<StudyResponse> => {
    const response = await request<StudyResponse>({
      method: 'GET',
      url: `${STUDY_API_PATH}/${studyId}`,
    });
    return response.data;
  },
};

// Application API methods
export const applicationApi = {
  // Apply to a study
  apply: async (studyId: string, data: ApplicationRequest): Promise<ApiResponse<ApplicationResponse>> => {
    return request<ApplicationResponse>({
      method: 'POST',
      url: `${STUDY_API_PATH}/${studyId}/applications`,
      data,
    });
  },

  // Get applications for a study
  getApplications: async (studyId: string, params?: PageRequest): Promise<ApiResponse<Page<ApplicationResponse>>> => {
    return request<Page<ApplicationResponse>>({
      method: 'GET',
      url: `${STUDY_API_PATH}/${studyId}/applications`,
      params,
    });
  },

  // Get single application
  getApplication: async (studyId: string, applicationId: string): Promise<ApiResponse<ApplicationResponse>> => {
    return request<ApplicationResponse>({
      method: 'GET',
      url: `${STUDY_API_PATH}/${studyId}/applications/${applicationId}`,
    });
  },

  // Accept application
  acceptApplication: async (studyId: string, applicationId: string, data: AcceptApplicationRequest): Promise<ApiResponse<any>> => {
    return request<any>({
      method: 'POST',
      url: `${STUDY_API_PATH}/${studyId}/applications/${applicationId}/accept`,
      data,
    });
  },

  // Reject application
  rejectApplication: async (studyId: string, applicationId: string, data: RejectApplicationRequest): Promise<ApiResponse<void>> => {
    return request<void>({
      method: 'POST',
      url: `${STUDY_API_PATH}/${studyId}/applications/${applicationId}/reject`,
      data,
    });
  },

  // Cancel application
  cancelApplication: async (studyId: string, applicationId: string, applicantId: string): Promise<ApiResponse<void>> => {
    return request<void>({
      method: 'DELETE',
      url: `${STUDY_API_PATH}/${studyId}/applications/${applicationId}`,
      params: { applicantId },
    });
  },
};