import { request } from './client';
import type {
  CompanyEmailVerification,
  PendingVerificationsResponse
} from '../types/queryDailyMobile';

// Gateway를 통한 querydaily-mobile-service 접근 경로
// Gateway가 /api/querydaily-mobile/** → querydaily-mobile-service로 라우팅
const QUERYDAILY_MOBILE_API_PATH = '/api/querydaily-mobile/admin/company-emails';

// Company Email Verification API methods
export const queryDailyMobileApi = {
  /**
   * 승인 대기 중인 회사 이메일 인증 목록 조회
   * GET /api/querydaily-mobile/admin/company-emails/pending
   */
  getPendingVerifications: async (): Promise<PendingVerificationsResponse> => {
    const response = await request<PendingVerificationsResponse>({
      method: 'GET',
      url: `${QUERYDAILY_MOBILE_API_PATH}/pending`,
    });
    return response.data;
  },

  /**
   * 회사 이메일 인증 승인
   * POST /api/querydaily-mobile/admin/company-emails/{verificationId}/approve
   */
  approveVerification: async (verificationId: string): Promise<CompanyEmailVerification> => {
    const response = await request<CompanyEmailVerification>({
      method: 'POST',
      url: `${QUERYDAILY_MOBILE_API_PATH}/${verificationId}/approve`,
    });
    return response.data;
  },

  /**
   * 회사 이메일 인증 거절
   * POST /api/querydaily-mobile/admin/company-emails/{verificationId}/reject
   */
  rejectVerification: async (
    verificationId: string,
    reason: string
  ): Promise<CompanyEmailVerification> => {
    const response = await request<CompanyEmailVerification>({
      method: 'POST',
      url: `${QUERYDAILY_MOBILE_API_PATH}/${verificationId}/reject`,
      data: { reason },
    });
    return response.data;
  },
};
