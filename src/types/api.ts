// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: AppError;
}

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// Study Types
export const StudyStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  TERMINATED: 'TERMINATED'
} as const;

export type StudyStatus = typeof StudyStatus[keyof typeof StudyStatus];

export interface StudyCreateRequest {
  title: string;
  description: string;
  proposerId: string;
}

export interface StudyResponse {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  status: StudyStatus;
  createdAt: string;
  updatedAt: string;
}

// Page Response
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Query Parameters
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}