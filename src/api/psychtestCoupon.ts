import apiClient from './client';

export interface PsychtestCouponResponse {
  id: number;
  code: string;
  couponType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ACCESS';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  maxRedemptions: number;
  currentRedemptions: number;
  applicableTestSlugs: string[] | null;
  status: 'ACTIVE' | 'EXHAUSTED' | 'DISABLED';
  issuedBy: string;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

export interface CreatePsychtestCouponRequest {
  code?: string;
  couponType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ACCESS';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  maxRedemptions?: number;
  applicableTestSlugs?: string[] | null;
  issuedBy?: string;
  validFrom?: string;
  validUntil?: string | null;
}

export interface UpdatePsychtestCouponRequest {
  status?: 'ACTIVE' | 'EXHAUSTED' | 'DISABLED';
  maxRedemptions?: number;
  validUntil?: string | null;
  applicableTestSlugs?: string[] | null;
}

const BASE_URL = '/api/psychtest/coupons/admin';

export const psychtestCouponApi = {
  list: async (): Promise<PsychtestCouponResponse[]> => {
    const response = await apiClient.get(BASE_URL);
    const data = response.data;
    return data.data || data;
  },

  create: async (request: CreatePsychtestCouponRequest): Promise<PsychtestCouponResponse> => {
    const response = await apiClient.post(BASE_URL, request);
    const data = response.data;
    return data.data || data;
  },

  update: async (id: number, request: UpdatePsychtestCouponRequest): Promise<PsychtestCouponResponse> => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, request);
    const data = response.data;
    return data.data || data;
  },

  disable: async (id: number): Promise<PsychtestCouponResponse> => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    const data = response.data;
    return data.data || data;
  },
};
