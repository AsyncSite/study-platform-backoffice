import axios from './client';

export interface ApplicationResponse {
  id: string;
  studyId: string;
  studyTitle: string;
  applicantId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  answers: Record<string, string>;
  introduction?: string;
  rejectionReason?: string;
  appliedAt: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRequest {
  applicantId: string;
  answers: Record<string, string>;
  introduction?: string;
}

export interface AcceptApplicationRequest {
  reviewerId: string;
  note?: string;
}

export interface RejectApplicationRequest {
  reviewerId: string;
  reason: string;
}

export interface MemberResponse {
  id: string;
  studyId: string;
  studyTitle: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
  joinedAt: string;
  lastActiveAt?: string;
  warningCount: number;
  introduction?: string;
  leftAt?: string;
}

export interface ChangeMemberRoleRequest {
  requesterId: string;
  newRole: 'MANAGER' | 'MEMBER';
}

export interface WarnMemberRequest {
  requesterId: string;
  reason: string;
}

export const membershipApi = {
  // Application APIs
  async getApplications(studyId: string, params?: { page?: number; size?: number; status?: string }) {
    const response = await axios.get<{
      content: ApplicationResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
    }>(`/api/studies/${studyId}/applications`, { params });
    return response.data;
  },

  async getApplication(studyId: string, applicationId: string) {
    const response = await axios.get<ApplicationResponse>(
      `/api/studies/${studyId}/applications/${applicationId}`
    );
    return response.data;
  },

  async submitApplication(studyId: string, request: ApplicationRequest) {
    const response = await axios.post<ApplicationResponse>(
      `/api/studies/${studyId}/applications`,
      request
    );
    return response.data;
  },

  async acceptApplication(studyId: string, applicationId: string, request: AcceptApplicationRequest) {
    const response = await axios.post<{ memberId: string }>(
      `/api/studies/${studyId}/applications/${applicationId}/accept`,
      request
    );
    return response.data;
  },

  async rejectApplication(studyId: string, applicationId: string, request: RejectApplicationRequest) {
    await axios.post(
      `/api/studies/${studyId}/applications/${applicationId}/reject`,
      request
    );
  },

  async cancelApplication(studyId: string, applicationId: string, applicantId: string) {
    await axios.delete(`/api/studies/${studyId}/applications/${applicationId}`, {
      params: { applicantId }
    });
  },

  // Member APIs
  async getMembers(studyId: string, params?: { page?: number; size?: number; role?: string; status?: string }) {
    const response = await axios.get<{
      content: MemberResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
    }>(`/api/studies/${studyId}/members`, { params });
    return response.data;
  },

  async getMember(studyId: string, memberId: string) {
    const response = await axios.get<MemberResponse>(
      `/api/studies/${studyId}/members/${memberId}`
    );
    return response.data;
  },

  async getMemberCount(studyId: string) {
    const response = await axios.get<number>(`/api/studies/${studyId}/members/count`);
    return response.data;
  },

  async changeMemberRole(studyId: string, memberId: string, request: ChangeMemberRoleRequest) {
    await axios.put(`/api/studies/${studyId}/members/${memberId}/role`, request);
  },

  async removeMember(studyId: string, memberId: string, requesterId: string) {
    await axios.delete(`/api/studies/${studyId}/members/${memberId}`, {
      params: { requesterId }
    });
  },

  async warnMember(studyId: string, memberId: string, request: WarnMemberRequest) {
    await axios.post(`/api/studies/${studyId}/members/${memberId}/warnings`, request);
  },

  async leaveStudy(studyId: string, userId: string) {
    await axios.post(`/api/studies/${studyId}/members/leave`, null, {
      params: { userId }
    });
  },

  async getMemberStatistics(studyId: string) {
    const response = await axios.get<Record<string, any>>(
      `/api/studies/${studyId}/members/statistics`
    );
    return response.data;
  },

  // My Study APIs
  async getMyStudies(userId: string) {
    const response = await axios.get<{
      proposedStudies: any[];
      participatingStudies: any[];
      leadingStudies: any[];
    }>(`/api/studies/my`, { params: { userId } });
    return response.data;
  },

  async getMyApplications(userId: string) {
    const response = await axios.get<ApplicationResponse[]>(`/api/studies/my/applications`, {
      params: { userId }
    });
    return response.data;
  }
};