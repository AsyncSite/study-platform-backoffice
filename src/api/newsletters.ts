import axios from 'axios';
import { env } from '../config/environment';

const newsletterClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type NewsletterStatus = 'DRAFT' | 'SCHEDULED' | 'SENT';

export interface Newsletter {
  id: number;
  issueNumber: number;
  title: string;
  content: string;
  status: NewsletterStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsletterRequest {
  title: string;
  content: string;
}

export interface UpdateNewsletterRequest {
  title: string;
  content: string;
}

export interface TestSendRequest {
  email: string;
}

export interface ScheduleRequest {
  scheduledAt: string;
}

export interface SendResult {
  id: number;
  newsletterId: number;
  subscriberId: string;
  email: string;
  status: 'SENT' | 'FAILED' | 'SCHEDULED' | 'CANCELLED';
  notificationId: string | null;
  errorMessage: string | null;
  isTest: boolean;
  processedAt: string;
  createdAt: string;
}

export interface SendResultPage {
  content: SendResult[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SendStats {
  sentCount: number;
  failedCount: number;
  totalCount: number;
  successRate: number;
}

export interface PreviewResponse {
  htmlContent: string;
}

const NEWSLETTER_API_URL = '/api/grit-service/grit/newsletter/newsletters';

export const newslettersApi = {
  // 목록 조회
  getAll: async (status?: NewsletterStatus): Promise<Newsletter[]> => {
    const params = status ? { status } : {};
    const response = await newsletterClient.get(NEWSLETTER_API_URL, { params });
    return response.data;
  },

  // 상세 조회
  getById: async (id: number): Promise<Newsletter> => {
    const response = await newsletterClient.get(`${NEWSLETTER_API_URL}/${id}`);
    return response.data;
  },

  // 생성
  create: async (request: CreateNewsletterRequest): Promise<Newsletter> => {
    const response = await newsletterClient.post(NEWSLETTER_API_URL, request);
    return response.data;
  },

  // 수정
  update: async (id: number, request: UpdateNewsletterRequest): Promise<Newsletter> => {
    const response = await newsletterClient.put(`${NEWSLETTER_API_URL}/${id}`, request);
    return response.data;
  },

  // 삭제
  delete: async (id: number): Promise<void> => {
    await newsletterClient.delete(`${NEWSLETTER_API_URL}/${id}`);
  },

  // 테스트 발송
  sendTest: async (id: number, request: TestSendRequest): Promise<{ message: string }> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/${id}/test-send`, request);
    return response.data;
  },

  // 즉시 발송
  send: async (id: number): Promise<{ message: string }> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/${id}/send`);
    return response.data;
  },

  // 예약 발송
  schedule: async (id: number, request: ScheduleRequest): Promise<{ message: string }> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/${id}/schedule`, request);
    return response.data;
  },

  // 예약 취소
  cancelSchedule: async (id: number): Promise<{ message: string }> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/${id}/cancel-schedule`);
    return response.data;
  },

  // 발송 결과 조회 (페이징)
  getSendResults: async (id: number, page: number = 0, size: number = 20): Promise<SendResultPage> => {
    const response = await newsletterClient.get(`${NEWSLETTER_API_URL}/${id}/send-results`, {
      params: { page, size },
    });
    return response.data;
  },

  // 발송 통계 조회
  getSendStats: async (id: number): Promise<SendStats> => {
    const response = await newsletterClient.get(`${NEWSLETTER_API_URL}/${id}/send-stats`);
    return response.data;
  },

  // 미리보기 (기존 뉴스레터)
  preview: async (id: number): Promise<PreviewResponse> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/${id}/preview`);
    return response.data;
  },

  // 미리보기 (직접 내용 전달)
  previewDirect: async (title: string, content: string): Promise<PreviewResponse> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/preview`, { title, content });
    return response.data;
  },
};
