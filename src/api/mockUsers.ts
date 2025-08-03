import type {
  User,
  UserDetail,
  UserListRequest,
  UserListResponse,
  UserStatistics,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest
} from '../types/user';
import { UserStatus } from '../types/user';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: '김철수',
    profileImage: 'https://via.placeholder.com/150',
    role: 'USER',
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-15T10:30:00Z',
    lastLoginAt: '2024-03-20T14:22:00Z',
    provider: 'local',
    // studyCount: 3
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    name: '이영희',
    role: 'USER',
    status: UserStatus.ACTIVE,
    createdAt: '2024-02-20T09:15:00Z',
    lastLoginAt: '2024-03-21T10:45:00Z',
    provider: 'google',
    // studyCount: 5
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: '관리자',
    role: 'ADMIN',
    status: UserStatus.ACTIVE,
    createdAt: '2023-12-01T08:00:00Z',
    lastLoginAt: '2024-03-21T16:30:00Z',
    provider: 'local',
    // studyCount: 0
  },
  {
    id: '4',
    email: 'inactive@example.com',
    name: '박민수',
    role: 'USER',
    status: UserStatus.INACTIVE,
    createdAt: '2024-01-10T11:20:00Z',
    lastLoginAt: '2024-02-15T13:40:00Z',
    provider: 'kakao',
    // studyCount: 1
  },
  {
    id: '5',
    email: 'withdrawn@example.com',
    name: '탈퇴회원',
    role: 'USER',
    status: UserStatus.WITHDRAWN,
    createdAt: '2023-11-05T14:00:00Z',
    provider: 'local',
    // studyCount: 0
  }
];

// Generate more mock users
for (let i = 6; i <= 50; i++) {
  const providers = ['local', 'google', 'kakao', 'naver'];
  const statuses = [UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.INACTIVE];
  const roles = ['USER', 'USER', 'USER', 'USER', 'OPERATOR'];
  
  mockUsers.push({
    id: i.toString(),
    email: `user${i}@example.com`,
    name: `사용자${i}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    provider: providers[Math.floor(Math.random() * providers.length)] as any,
    // studyCount: Math.floor(Math.random() * 10)
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockUsersApi = {
  getUsers: async (params: UserListRequest): Promise<UserListResponse> => {
    await delay(500);
    
    let filteredUsers = [...mockUsers];
    
    // Apply filters
    if (params.role) {
      filteredUsers = filteredUsers.filter(u => u.role === params.role);
    }
    if (params.status) {
      filteredUsers = filteredUsers.filter(u => u.status === params.status);
    }
    if (params.provider) {
      filteredUsers = filteredUsers.filter(u => u.provider === params.provider);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.email.toLowerCase().includes(search) || 
        u.name.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    if (params.sort) {
      const [field, order] = params.sort.split(',');
      filteredUsers.sort((a, b) => {
        let aVal = a[field as keyof User];
        let bVal = b[field as keyof User];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        return 0;
      });
    }
    
    // Apply pagination
    const page = params.page || 0;
    const size = params.size || 20;
    const start = page * size;
    const end = start + size;
    const paginatedUsers = filteredUsers.slice(start, end);
    
    return {
      content: paginatedUsers,
      totalElements: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / size),
      size,
      number: page,
      first: page === 0,
      last: page === Math.ceil(filteredUsers.length / size) - 1
    };
  },

  getUserDetail: async (userId: string): Promise<UserDetail> => {
    await delay(300);
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      ...user,
      phoneNumber: '010-1234-5678',
      updatedAt: user.createdAt,
      participatingStudies: [
        {
          id: '1',
          title: 'React 스터디',
          status: 'ACTIVE',
          role: 'PARTICIPANT',
          joinedAt: '2024-02-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'TypeScript 마스터',
          status: 'COMPLETED',
          role: 'PROPOSER',
          joinedAt: '2024-01-15T09:00:00Z'
        }
      ],
      // paymentSummary: {
      //   totalAmount: 150000,
      //   totalCount: 3,
      //   lastPaymentAt: '2024-03-15T14:30:00Z'
      // },
      activityLogs: [
        {
          id: '1',
          action: 'LOGIN',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          createdAt: '2024-03-21T10:00:00Z'
        },
        {
          id: '2',
          action: 'STUDY_JOIN',
          details: 'React 스터디 참여',
          createdAt: '2024-03-20T15:30:00Z'
        }
      ]
    };
  },

  updateUserRole: async (userId: string, data: UpdateUserRoleRequest): Promise<User> => {
    await delay(500);
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.role = data.role;
    return { ...user };
  },

  updateUserStatus: async (userId: string, data: UpdateUserStatusRequest): Promise<User> => {
    await delay(500);
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.status = data.status;
    return { ...user };
  },

  resetUserPassword: async (userId: string): Promise<{ message: string }> => {
    await delay(700);
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return { message: '비밀번호 초기화 이메일을 발송했습니다.' };
  },

  getUserStatistics: async (): Promise<UserStatistics> => {
    await delay(400);
    
    const activeUsers = mockUsers.filter(u => u.status === UserStatus.ACTIVE).length;
    const withdrawnUsers = mockUsers.filter(u => u.status === UserStatus.WITHDRAWN).length;
    
    return {
      totalUsers: mockUsers.length,
      activeUsers,
      inactiveUsers: mockUsers.filter(u => u.status === UserStatus.INACTIVE).length,
      withdrawnUsers,
      newUsersToday: 3,
      newUsersThisWeek: 8,
      newUsersThisMonth: 12,
      usersByRole: {
        USER: mockUsers.filter(u => u.role === 'USER').length,
        ADMIN: mockUsers.filter(u => u.role === 'ADMIN').length,
        OPERATOR: mockUsers.filter(u => u.role === 'OPERATOR').length
      },
      usersByProvider: {
        local: mockUsers.filter(u => u.provider === 'local').length,
        google: mockUsers.filter(u => u.provider === 'google').length,
        kakao: mockUsers.filter(u => u.provider === 'kakao').length,
        naver: mockUsers.filter(u => u.provider === 'naver').length
      }
      // monthlySignups: [
      //   { month: '2024-01', count: 15 },
      //   { month: '2024-02', count: 23 },
      //   { month: '2024-03', count: 12 }
      // ]
    };
  },

  exportUsers: async (_params: UserListRequest): Promise<Blob> => {
    await delay(1000);
    
    // Create mock CSV data
    const csvContent = 'email,name,role,status,createdAt\n' + 
      mockUsers.map(u => `${u.email},${u.name},${u.role},${u.status},${u.createdAt}`).join('\n');
    
    return new Blob([csvContent], { type: 'text/csv' });
  }
};