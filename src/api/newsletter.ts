import axios from 'axios';
import { env } from '../config/environment';

const newsletterClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  source: string | null;
  subscribedAt: string;
}

export interface SubscribersResponse {
  subscribers: Subscriber[];
  totalCount: number;
}

const NEWSLETTER_API_URL = '/api/grit-service/grit/newsletter';

export interface UnsubscribeResponse {
  email: string;
  message: string;
}

export const newsletterApi = {
  // 구독자 목록 조회
  getSubscribers: async (): Promise<SubscribersResponse> => {
    const response = await newsletterClient.get(`${NEWSLETTER_API_URL}/subscribers`);
    return response.data;
  },

  // 구독 취소
  unsubscribe: async (email: string): Promise<UnsubscribeResponse> => {
    const response = await newsletterClient.post(`${NEWSLETTER_API_URL}/unsubscribe`, { email });
    return response.data;
  },
};
