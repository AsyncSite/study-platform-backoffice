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
  validateSession: () => Promise<boolean>;
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

  // Function to validate current session
  const validateSession = async (): Promise<boolean> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    try {
      // Check if token looks like a JWT (has 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        // Invalid token format, remove it
        console.warn('Invalid token format detected, removing...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return false;
      }

      // Decode JWT to check expiration
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if exp exists
      if (!payload.exp) {
        // No expiration, assume valid
        return true;
      }
      
      const exp = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= exp) {
        // Token expired
        console.log('Token expired, cleaning up...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }
      
      return true;
    } catch (error) {
      // If we can't parse the token, let API calls handle validation
      console.warn('Could not parse token, keeping session:', error);
      return true;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Simply restore the user from localStorage
          // Let API calls handle token validation
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
    
    // Listen for auth:expired events
    const handleAuthExpired = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, { type: 'error' });
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    };
    
    // Listen for auth:forbidden events (403 - no permission)
    const handleAuthForbidden = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, { type: 'error' });
    };
    
    // Listen for server:error events (500 - server error)
    const handleServerError = (event: CustomEvent<{ message: string; shouldReauth?: boolean }>) => {
      showToast(event.detail.message, { type: 'error' });
      
      // If it might be an auth issue, suggest re-login
      if (event.detail.shouldReauth) {
        setTimeout(() => {
          showToast('인증 문제일 수 있습니다. 다시 로그인을 시도해보세요.', { type: 'warning' });
        }, 2000);
      }
    };
    
    // Listen for api:notfound events (404 - not found)
    const handleApiNotFound = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, { type: 'warning' });
    };
    
    // Listen for network:error events
    const handleNetworkError = (event: CustomEvent<{ message: string }>) => {
      showToast(event.detail.message, { type: 'error' });
    };
    
    window.addEventListener('auth:expired', handleAuthExpired as EventListener);
    window.addEventListener('auth:forbidden', handleAuthForbidden as EventListener);
    window.addEventListener('server:error', handleServerError as EventListener);
    window.addEventListener('api:notfound', handleApiNotFound as EventListener);
    window.addEventListener('network:error', handleNetworkError as EventListener);
    
    // Set up periodic token validation (check every 10 minutes)
    const intervalId = setInterval(async () => {
      if (user) {
        const isValid = await validateSession();
        if (!isValid) {
          showToast('세션이 만료되었습니다. 다시 로그인해주세요.', { type: 'warning' });
          setUser(null);
          navigate('/login');
        }
      }
    }, 600000); // Check every 10 minutes
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener);
      window.removeEventListener('auth:forbidden', handleAuthForbidden as EventListener);
      window.removeEventListener('server:error', handleServerError as EventListener);
      window.removeEventListener('api:notfound', handleApiNotFound as EventListener);
      window.removeEventListener('network:error', handleNetworkError as EventListener);
      clearInterval(intervalId);
    };
  }, [showToast, navigate]);

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
    showToast('로그아웃되었습니다.', { type: 'info' });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    validateSession,
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