import apiClient from '../api/client';
import { env } from '../config/environment';

export interface QueryApplication {
  id: number;
  memberId: string;
  email: string;
  name: string;
  resumeFileName: string;
  resumeAssetId: string;
  createdAt: string;
}

export interface Question {
  id: string;
  memberId: string;
  content: string;
  type: 'TRIAL' | 'GROWTH_PLAN';
  currentDay?: number;
  totalDays?: number;
  scheduledAt: string;
}

export interface QuestionWithMember {
  id: string;
  member: {
    memberId: string;
    email: string;
    name: string;
  };
  content: string;
  type: 'TRIAL' | 'GROWTH_PLAN';
  currentDay?: number;
  totalDays?: number;
  scheduledAt: string;
  hasAnswer: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  memberId: string;
  type: 'TRIAL' | 'GROWTH_PLAN';
  content: {
    version?: string;
    question?: string;
    analysis: string;
    keywords: string[];
    starStructure: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    personaAnswers: {
      bigTech: string;
      unicorn: string;
    };
    followUpQuestions: string[];
  };
  scheduledAt: string;
}

export interface AnswerWithMember {
  id: string;
  questionId: string | null;
  questionContent: string | null;
  currentDay: number | null;
  totalDays: number | null;
  member: {
    memberId: string;
    email: string;
    name: string;
  };
  type: 'TRIAL' | 'GROWTH_PLAN';
  answerContent: string;  // JSON string
  scheduledAt: string;
  createdAt?: string;
}

export interface CreateQuestionRequest {
  email: string;
  purchaseId: string;  // 구매 ID (필수)
  content: string;
  type: 'TRIAL' | 'GROWTH_PLAN';
  currentDay?: number;
  totalDays?: number;
  scheduledAt?: string;  // Optional: null이면 즉시 발송
  displayName?: string;
}

export interface CreateAnswerRequest {
  email?: string;  // NEW 모드용 (필수)
  purchaseId?: string;  // NEW 모드용 (Question 없이 Answer만 생성할 때 필수)
  answerId?: string;  // RESEND 모드용 (재발송 시에만 사용)
  questionId?: string;  // NEW 모드용 (선택사항: Question 없이 Answer만 발송 가능)
  type?: 'TRIAL' | 'GROWTH_PLAN';  // NEW 모드용 (Question 없이 Answer만 생성할 때 필수)
  content?: {
    version?: string;
    question?: string;
    analysis: string;
    keywords: string[];
    starStructure: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    personaAnswers: {
      bigTech: string;
      unicorn: string;
    };
    followUpQuestions: string[];
    nextDayPreview: string;
  };
  scheduledAt?: string;
  displayName?: string;
}

export interface PurchaseAdmin {
  purchaseId: string;
  memberId: string;
  memberEmail: string;
  memberName: string;
  productCode: string;
  productName: string;
  productType: 'TRIAL' | 'PAID';
  purchasedPrice: number;
  transactionId: string | null;
  resumeId: string | null;
  resumeFilename: string | null;
  resumeDownloadUrl: string | null;
  subscriptionId: string | null;
  purchasedAt: string;
  expiresAt: string;
  isExpired: boolean;
  questionSentCount: number;  // 질문 발송 횟수
  answerSentCount: number;    // 답변 발송 횟수
  maxDeliveries: number;      // 최대 발송 횟수 (상품별 정책)
}

class QueryDailyService {
  /**
   * 전체 베타 테스트 신청자 목록 조회
   */
  async getAllApplications(): Promise<QueryApplication[]> {
    try {
      const response = await apiClient.get('/api/query-daily/admin/leads');
      console.log('✅ Fetched applications:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch applications:', error);
      // 401 에러는 apiClient interceptor에서 처리하도록 그대로 throw
      throw error;
    }
  }

  /**
   * 특정 신청자 정보 조회
   */
  async getApplication(id: number): Promise<QueryApplication> {
    try {
      const response = await apiClient.get(`/api/query-daily/admin/leads/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch application:', error);
      throw error;
    }
  }

  /**
   * Asset 다운로드 URL 생성
   */
  getAssetDownloadUrl(assetId: string): string {
    // Gateway를 통해 Asset Service 접근
    return `${env.apiBaseUrl}/api/assets/${assetId}/download?download=true`;
  }

  /**
   * 이력서 미리보기 URL 생성 (브라우저에서 직접 열기)
   */
  getAssetPreviewUrl(assetId: string): string {
    return `${env.apiBaseUrl}/api/assets/${assetId}/download`;
  }

  /**
   * Asset 파일 다운로드 (JWT 토큰 포함)
   */
  async downloadAsset(assetId: string, fileName: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/assets/${assetId}/download`, {
        responseType: 'blob',
        params: { download: true }
      });

      // Blob URL 생성
      const url = window.URL.createObjectURL(response.data);

      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();

      // 정리
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Asset downloaded:', fileName);
    } catch (error: any) {
      console.error('❌ Failed to download asset:', error);
      throw error;
    }
  }

  /**
   * 질문 생성 및 이메일 발송 (Kafka 이벤트 자동 처리)
   */
  async createQuestion(request: CreateQuestionRequest): Promise<{ id: string }> {
    try {
      const response = await apiClient.post('/api/query-daily/admin/questions', request);
      console.log('✅ Question created:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to create question:', error);
      throw error;
    }
  }

  /**
   * 질문 목록 조회 (모든 질문 또는 필터링)
   */
  async getQuestions(params: {
    memberId?: string;
    type?: 'TRIAL' | 'GROWTH_PLAN';
    hasAnswer?: boolean;
    page?: number;
    size?: number;
  }): Promise<{ content: QuestionWithMember[]; totalElements: number; totalPages: number }> {
    try {
      const response = await apiClient.get('/api/query-daily/admin/questions', {
        params: {
          page: params.page || 0,
          size: params.size || 50,
          ...(params.hasAnswer !== undefined && { hasAnswer: params.hasAnswer }),
          ...(params.memberId && { memberId: params.memberId }),
          ...(params.type && { type: params.type })
        }
      });
      console.log('✅ Fetched questions:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch questions:', error);
      throw error;
    }
  }

  /**
   * 답변이 없는 질문 목록 조회 (답변 작성 시 사용)
   */
  async getQuestionsWithoutAnswers(params: {
    memberId?: string;
    type?: 'TRIAL' | 'GROWTH_PLAN';
    page?: number;
    size?: number;
  }): Promise<{ content: QuestionWithMember[]; totalElements: number; totalPages: number }> {
    return this.getQuestions({ ...params, hasAnswer: false });
  }

  /**
   * 답변 생성 및 이메일 발송 (Kafka 이벤트 자동 처리) 또는 재발송
   */
  async createAnswer(request: CreateAnswerRequest): Promise<{ id: string }> {
    try {
      const response = await apiClient.post('/api/query-daily/admin/answers', request);
      console.log('✅ Answer created/resent:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to create/resend answer:', error);
      throw error;
    }
  }

  /**
   * 답변 목록 조회 (발송 이력 관리용)
   */
  async getAnswers(params: {
    memberId?: string;
    type?: 'TRIAL' | 'GROWTH_PLAN';
    email?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: AnswerWithMember[]; totalElements: number; totalPages: number }> {
    try {
      const response = await apiClient.get('/api/query-daily/admin/answers', {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          ...(params.memberId && { memberId: params.memberId }),
          ...(params.type && { type: params.type }),
          ...(params.email && { email: params.email })
        }
      });
      console.log('✅ Fetched answers:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch answers:', error);
      throw error;
    }
  }

  /**
   * 답변 가이드 재발송
   */
  async resendAnswerGuide(answerId: string): Promise<{ id: string }> {
    try {
      const response = await apiClient.post('/api/query-daily/admin/answers', {
        answerId,  // RESEND 모드
      });
      console.log('✅ Answer guide resent:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to resend answer guide:', error);
      throw error;
    }
  }

  /**
   * 예약된 질문 취소
   */
  async cancelQuestion(questionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/query-daily/admin/questions/${questionId}`);
      console.log('✅ Question cancelled:', questionId);
    } catch (error: any) {
      console.error('❌ Failed to cancel question:', error);
      throw error;
    }
  }

  /**
   * 예약된 답변 취소
   */
  async cancelAnswer(answerId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/query-daily/admin/answers/${answerId}`);
      console.log('✅ Answer cancelled:', answerId);
    } catch (error: any) {
      console.error('❌ Failed to cancel answer:', error);
      throw error;
    }
  }

  /**
   * 전체 구매 내역 조회 (필터링 가능)
   */
  async getPurchases(params?: {
    type?: 'TRIAL' | 'PAID';
    hasResume?: boolean;
  }): Promise<PurchaseAdmin[]> {
    try {
      const response = await apiClient.get('/api/query-daily/admin/purchases', {
        params: {
          ...(params?.type && { type: params.type }),
          ...(params?.hasResume !== undefined && { hasResume: params.hasResume })
        }
      });
      console.log('✅ Fetched purchases:', response.data.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch purchases:', error);
      throw error;
    }
  }
}

export default new QueryDailyService();