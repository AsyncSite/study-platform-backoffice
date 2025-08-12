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
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  TERMINATED: 'TERMINATED'
} as const;

export type StudyStatus = typeof StudyStatus[keyof typeof StudyStatus];

export interface StudyCreateRequest {
  title: string;
  description: string;
  proposerId: string;
  // Phase 1 추가 필드들 (모두 optional)
  generation?: number;
  slug?: string;
  type?: StudyType;
  tagline?: string;
  schedule?: string;
  duration?: string;
  capacity?: number;
  recruitDeadline?: string; // ISO date string
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export const StudyType = {
  PARTICIPATORY: 'PARTICIPATORY',
  EDUCATIONAL: 'EDUCATIONAL'
} as const;

export type StudyType = typeof StudyType[keyof typeof StudyType];

export interface StudyResponse {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  status: StudyStatus;
  createdAt: string | number[];
  updatedAt: string | number[];
  rejectionReason?: string;
  // Phase 1 추가 필드들
  generation?: number;
  slug?: string;
  type?: StudyType;
  tagline?: string;
  schedule?: string;
  duration?: string;
  capacity?: number;
  enrolled?: number;
  recruitDeadline?: string | number[];
  startDate?: string | number[];
  endDate?: string | number[];
  // Soft delete fields
  deleted?: boolean;
  deletedAt?: string | number[];
}

export interface StudyRejectRequest {
  reason: string;
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

// Application Types
export const ApplicationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED'
} as const;

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

export interface ApplicationRequest {
  applicantId: string;
  answers: Record<string, string>;
}

export interface ApplicationResponse {
  id: string;
  studyId: string;
  applicantId: string;
  status: ApplicationStatus;
  answers: Record<string, string>;
  appliedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewNote?: string;
}

export interface AcceptApplicationRequest {
  reviewerId: string;
  note?: string;
}

export interface RejectApplicationRequest {
  reviewerId: string;
  reason: string;
}