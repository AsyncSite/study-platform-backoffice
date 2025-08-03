// User Management Types

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  WITHDRAWN: 'WITHDRAWN'
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const UserProvider = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
  KAKAO: 'KAKAO',
  NAVER: 'NAVER'
} as const;

export type UserProvider = typeof UserProvider[keyof typeof UserProvider];

// Basic user type for list view
export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  profileImage?: string;
  role: string; // 'ROLE_USER' | 'ROLE_ADMIN'
  status: UserStatus;
  provider: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Detailed user type for detail view
export interface UserDetail extends User {
  updatedAt: string;
  // Additional fields can be added later based on requirements
  participatingStudies?: StudySummary[];
  proposedStudies?: StudySummary[];
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
  activeUsers: number;
  inactiveUsers: number;
  withdrawnUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByProvider: Record<string, number>;
}