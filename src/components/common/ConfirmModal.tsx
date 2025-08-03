import React from 'react';
import styled from 'styled-components';
import Button, { ButtonVariant, ButtonSize } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return ButtonVariant.DANGER;
      case 'warning':
        return ButtonVariant.WARNING;
      case 'info':
      default:
        return ButtonVariant.PRIMARY;
    }
  };

  return (
    <ModalOverlay onClick={handleCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader $variant={variant}>
          <Icon>{getIcon()}</Icon>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ModalMessage>{message}</ModalMessage>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.SECONDARY}
            size={ButtonSize.MEDIUM}
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            size={ButtonSize.MEDIUM}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.large};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div<{ $variant: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'danger':
        return theme.colors.error + '10';
      case 'warning':
        return '#f59e0b10';
      case 'info':
      default:
        return theme.colors.primary + '10';
    }
  }};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Icon = styled.div`
  font-size: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ModalBody = styled.div`
  padding: 24px 20px;
`;

const ModalMessage = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  white-space: pre-line; // Allows line breaks in the message
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

export default ConfirmModal;