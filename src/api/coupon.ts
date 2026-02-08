import apiClient from './client';

export interface CouponResponse {
  couponId: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  maxRedemptions: number;
  maxRedemptionsPerUser: number;
  currentRedemptions: number;
  validFrom: string;
  validUntil: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
  applicableProductIds: string[] | null;
  applicableTypes: string[] | null;
  issuedBy: string | null;
}

export interface CouponListResponse {
  coupons: CouponResponse[];
  total: number;
}

export interface CreateCouponRequest {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  maxRedemptions: number;
  maxRedemptionsPerUser: number;
  validFrom: string;
  validUntil: string | null;
  applicableProductIds: string[];
  applicableTypes: string[];
  issuedBy: string;
}

const COUPON_API_URL = '/api/v1/admin/coupons';

export const couponApi = {
  getAll: async (): Promise<CouponListResponse> => {
    const response = await apiClient.get(COUPON_API_URL);
    const data = response.data;
    return data.data || data;
  },

  getById: async (couponId: string): Promise<CouponResponse> => {
    const response = await apiClient.get(`${COUPON_API_URL}/${couponId}`);
    const data = response.data;
    return data.data || data;
  },

  create: async (request: CreateCouponRequest): Promise<CouponResponse> => {
    const response = await apiClient.post(COUPON_API_URL, request);
    const data = response.data;
    return data.data || data;
  },

  disable: async (couponId: string): Promise<void> => {
    await apiClient.patch(`${COUPON_API_URL}/${couponId}/status`, { status: 'DISABLED' });
  },
};
