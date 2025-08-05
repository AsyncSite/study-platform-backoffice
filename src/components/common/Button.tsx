import React from 'react';
import styled, { css } from 'styled-components';

export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DANGER: 'error', // Alias for ERROR
  GHOST: 'ghost',
} as const;

export type ButtonVariant = typeof ButtonVariant[keyof typeof ButtonVariant];

export const ButtonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type ButtonSize = typeof ButtonSize[keyof typeof ButtonSize];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MEDIUM,
  fullWidth = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

const getVariantStyles = (variant: ButtonVariant) => {
  const styles = {
    [ButtonVariant.PRIMARY]: css`
      background: ${({ theme }) => theme.gradients.primary};
      color: white;
      
      &:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        transform: translateY(-1px);
      }
    `,
    [ButtonVariant.SECONDARY]: css`
      background: ${({ theme }) => theme.colors.gray[200]};
      color: ${({ theme }) => theme.colors.gray[700]};
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.gray[300]};
      }
    `,
    [ButtonVariant.SUCCESS]: css`
      background: ${({ theme }) => theme.colors.success};
      color: white;
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.successDark};
      }
    `,
    [ButtonVariant.WARNING]: css`
      background: ${({ theme }) => theme.colors.warning};
      color: white;
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.warningDark};
      }
    `,
    [ButtonVariant.ERROR]: css`
      background: ${({ theme }) => theme.colors.error};
      color: white;
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.errorDark};
      }
    `,
    [ButtonVariant.GHOST]: css`
      background: transparent;
      color: ${({ theme }) => theme.colors.primary};
      border: 1px solid ${({ theme }) => theme.colors.primary};
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.primary};
        color: white;
      }
    `,
  };
  
  return styles[variant];
};

const getSizeStyles = (size: ButtonSize) => {
  const styles = {
    [ButtonSize.SMALL]: css`
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 12px;
    `,
    [ButtonSize.MEDIUM]: css`
      padding: 8px 16px;
      font-size: 13px;
      border-radius: 15px;
    `,
    [ButtonSize.LARGE]: css`
      padding: 12px 24px;
      font-size: 14px;
      border-radius: 18px;
    `,
  };
  
  return styles[size];
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  
  ${({ $variant }) => getVariantStyles($variant)}
  ${({ $size }) => getSizeStyles($size)}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default Button;