import apiClient from './client';
import type { Page } from '../types/api';

// Review status enum
export type ReviewStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  ACTIVE: '활성',
  HIDDEN: '숨김',
  DELETED: '삭제됨',
};

// Response type matching AdminReviewController.AdminReviewResponse
export interface AdminReviewResponse {
  id: number;
  email: string;
  productId: string;
  rating: number | null;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

// Filter params
export interface ReviewListParams {
  page?: number;
  size?: number;
  productId?: string;
  email?: string;
  status?: string;
}

const BASE = '/api/grit-service/grit/admin/reviews';

export const reviewApi = {
  getReviews: async (params: ReviewListParams): Promise<Page<AdminReviewResponse>> => {
    const response = await apiClient.get(BASE, { params });
    return response.data;
  },

  hideReview: async (id: number): Promise<void> => {
    await apiClient.patch(`${BASE}/${id}/hide`);
  },

  restoreReview: async (id: number): Promise<void> => {
    await apiClient.patch(`${BASE}/${id}/restore`);
  },

  deleteReview: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
