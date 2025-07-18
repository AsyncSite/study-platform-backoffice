// Environment configuration
interface EnvironmentConfig {
  apiBaseUrl: string;
  authApiUrl: string;
  enableMockAuth: boolean;
  appEnv: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    authApiUrl: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/auth',
    enableMockAuth: import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true',
    appEnv: (import.meta.env.VITE_APP_ENV as 'development' | 'production' | 'test') || 'development',
    isDevelopment,
    isProduction,
  };
};

export const env = getEnvironmentConfig();

// Log environment info in development
if (env.isDevelopment) {
  console.log('🚀 Environment Configuration:', {
    mode: import.meta.env.MODE,
    apiBaseUrl: env.apiBaseUrl,
    authApiUrl: env.authApiUrl,
    enableMockAuth: env.enableMockAuth,
  });
}