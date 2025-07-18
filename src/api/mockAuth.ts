import type { LoginRequest, LoginResponse } from '../types/auth';

// Mock user data for development
const MOCK_USERS = [
  {
    username: 'admin@test.com',
    password: 'admin123',
    user: {
      id: 'mock-admin-001',
      username: 'admin@test.com',
      email: 'admin@test.com',
      role: 'ADMIN' as const,
      name: '테스트 관리자',
    },
  },
  {
    username: 'operator@test.com',
    password: 'operator123',
    user: {
      id: 'mock-operator-001',
      username: 'operator@test.com',
      email: 'operator@test.com',
      role: 'OPERATOR' as const,
      name: '테스트 운영자',
    },
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Simulate network delay
    await delay(500);

    // Find matching user
    const mockUser = MOCK_USERS.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (!mockUser) {
      throw {
        response: {
          status: 401,
          data: {
            success: false,
            message: '아이디 또는 비밀번호가 올바르지 않습니다.',
          },
        },
      };
    }

    // Return successful response
    return {
      success: true,
      data: {
        accessToken: `mock-jwt-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        username: mockUser.user.username,
        email: mockUser.user.email,
        roles: [mockUser.user.role],
      },
      message: '로그인 성공',
    };
  },

  logout: async (): Promise<void> => {
    await delay(100);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  verifyToken: async (token: string): Promise<boolean> => {
    await delay(200);
    // In mock mode, consider all tokens starting with 'mock-jwt-token' as valid
    return token.startsWith('mock-jwt-token');
  },
};

// Mock login info component for development
export const MockLoginInfo = () => `
  <div style="
    background: #fef3c7;
    border: 1px solid #fbbf24;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  ">
    <strong>🧪 개발 환경 테스트 계정</strong><br/>
    <br/>
    관리자: admin@test.com / admin123<br/>
    운영자: operator@test.com / operator123
  </div>
`;