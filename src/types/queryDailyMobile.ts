// Verification Status Enum
export const VerificationStatus = {
  PENDING: 'PENDING',
  CODE_VERIFIED: 'CODE_VERIFIED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type VerificationStatus = typeof VerificationStatus[keyof typeof VerificationStatus];

// Company Email Verification Response
export interface CompanyEmailVerification {
  verificationId: string;
  userId: string;
  companyEmail: string;
  companyName: string;
  verifiedAt: string;  // ISO datetime string (코드 인증 완료 시각)
  createdAt: string;   // ISO datetime string (인증 요청 시각)
  status?: VerificationStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

// API Responses
export interface PendingVerificationsResponse {
  pendingVerifications: CompanyEmailVerification[];
  totalCount: number;
}

export interface ApprovedVerificationsResponse {
  approvedVerifications: CompanyEmailVerification[];
  totalCount: number;
}

export interface RejectedVerificationsResponse {
  rejectedVerifications: CompanyEmailVerification[];
  totalCount: number;
}

// Request DTOs
export interface ApproveCompanyEmailRequest {
  verificationId: string;
}

export interface RejectCompanyEmailRequest {
  verificationId: string;
  reason: string;
}

// Tab types
export type CompanyEmailTab = 'PENDING' | 'APPROVED' | 'REJECTED';
