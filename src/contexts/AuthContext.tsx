import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, LoginRequest } from '../types/auth';
import { UserRole } from '../types/auth';
import { authApi } from '../api/auth';
import { useNotification } from '../contexts/NotificationContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Simply restore the user from localStorage
          // If token is invalid, API calls will return 401 and we'll handle it in axios interceptor
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
    
    // Listen for auth:expired events
    const handleAuthExpired = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, 'error');
      setUser(null);
    };
    
    window.addEventListener('auth:expired', handleAuthExpired as EventListener);
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener);
    };
  }, [showToast]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, username, email, roles } = response.data;
        
        // Check if user is admin
        if (!roles.includes('ADMIN') && !roles.includes('OPERATOR')) {
          throw new Error('접근 권한이 없습니다. 관리자만 접속할 수 있습니다.');
        }
        
        // Create user object from response
        const user: User = {
          id: email, // Using email as ID since it's not provided
          username,
          email,
          role: roles.includes('ADMIN') ? UserRole.ADMIN : UserRole.OPERATOR,
          name: username
        };
        
        // Save to localStorage
        localStorage.setItem('authToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setUser(user);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error(response.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    navigate('/login');
    showToast('로그아웃되었습니다.', 'info');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};