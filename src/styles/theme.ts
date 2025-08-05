export const theme = {
  colors: {
    primary: '#6366f1',
    primaryLight: '#8b5cf6',
    primaryDark: '#4f46e5',
    
    success: '#10b981',
    successLight: '#34d399',
    successDark: '#059669',
    
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningDark: '#d97706',
    
    error: '#ef4444',
    errorLight: '#f87171',
    errorDark: '#dc2626',
    
    // Additional color aliases
    danger: '#ef4444',
    info: '#6366f1',
    secondary: '#64748b',
    disabled: '#94a3b8',
    border: '#e2e8f0',
    
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      disabled: '#cbd5e1',
    }
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.05)',
    medium: '0 2px 8px rgba(0, 0, 0, 0.1)',
    large: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  radii: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
    round: '50%',
    pill: '9999px',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
  
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
};

export type Theme = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

export default theme;