// User Management Types

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  WITHDRAWN: 'WITHDRAWN'
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const UserProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver'
} as const;

export type UserProvider = typeof UserProvider[keyof typeof UserProvider];

// Basic user type for list view
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  role: string; // 'USER' | 'ADMIN' | 'OPERATOR'
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  provider?: UserProvider;
  studyCount?: number;
}

// Detailed user type for detail view
export interface UserDetail extends User {
  phone?: string;
  loginCount: number;
  participatingStudies?: StudySummary[];
  proposedStudies?: StudySummary[];
  paymentSummary?: PaymentSummary;
  activityLogs?: ActivityLog[];
}

export interface StudySummary {
  id: string;
  title: string;
  status: string;
  role: 'PROPOSER' | 'PARTICIPANT';
  joinedAt: string;
}

export interface PaymentSummary {
  totalAmount: number;
  totalCount: number;
  lastPaymentAt?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Request types
export interface UserListRequest {
  page?: number;
  size?: number;
  sort?: string;
  role?: string;
  status?: UserStatus;
  provider?: UserProvider;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
  reason?: string;
}

// Response types
export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  withdrawnUsers: number;
  usersByRole: Record<string, number>;
  usersByProvider: Record<string, number>;
  monthlySignups: Array<{
    month: string;
    count: number;
  }>;
}