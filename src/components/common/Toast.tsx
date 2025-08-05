import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ⓘ';
    }
  };

  return (
    <ToastContainer $type={type} $isVisible={isVisible}>
      <IconWrapper>{getIcon()}</IconWrapper>
      <Message>{message}</Message>
    </ToastContainer>
  );
};

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $type: ToastType; $isVisible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#f59e0b';
      case 'info':
      default:
        return theme.colors.primary;
    }
  }};
  color: white;
  z-index: 9999;
  animation: ${({ $isVisible }) => $isVisible ? slideIn : slideOut} 0.3s ease-out;
  max-width: 400px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
`;

const Message = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
`;

export default Toast;