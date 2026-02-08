import axios from 'axios';
import { env } from '../config/environment';

// grit-moment API는 인증 없이 호출 (Authorization 헤더 제외)
const gritMomentClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GritMomentPrice {
  id: number;
  email: string;
  urlId: string;
  name: string;
  amount: number;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

export interface CreateGritMomentPriceRequest {
  email: string;
  urlId: string;
  name: string;
  amount: number;
}

const GRIT_MOMENT_API_URL = '/api/grit-service/grit/prices';

export const gritMomentApi = {
  // 전체 목록 조회
  getAll: async (): Promise<GritMomentPrice[]> => {
    const response = await gritMomentClient.get(GRIT_MOMENT_API_URL);
    const data = response.data;
    // Handle both array response and wrapped response {success, data}
    return Array.isArray(data) ? data : (data?.data || []);
  },

  // 생성
  create: async (data: CreateGritMomentPriceRequest): Promise<GritMomentPrice> => {
    const response = await gritMomentClient.post<GritMomentPrice>(GRIT_MOMENT_API_URL, data);
    return response.data;
  },

  // 수정
  update: async (id: number, data: CreateGritMomentPriceRequest): Promise<GritMomentPrice> => {
    const response = await gritMomentClient.put<GritMomentPrice>(`${GRIT_MOMENT_API_URL}/${id}`, data);
    return response.data;
  },

  // 삭제
  delete: async (id: number): Promise<void> => {
    await gritMomentClient.delete(`${GRIT_MOMENT_API_URL}/${id}`);
  },
};
