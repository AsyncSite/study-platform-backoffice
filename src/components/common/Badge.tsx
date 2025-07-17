import React from 'react';
import styled from 'styled-components';

export const BadgeVariant = {
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DEFAULT: 'default',
} as const;

export type BadgeVariant = typeof BadgeVariant[keyof typeof BadgeVariant];

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = BadgeVariant.DEFAULT,
  className 
}) => {
  return (
    <StyledBadge $variant={variant} className={className}>
      {children}
    </StyledBadge>
  );
};

const getVariantStyles = (variant: BadgeVariant, theme: any) => {
  const styles = {
    [BadgeVariant.PRIMARY]: {
      background: '#eff6ff',
      color: theme.colors.primary,
    },
    [BadgeVariant.SUCCESS]: {
      background: '#dcfce7',
      color: '#16a34a',
    },
    [BadgeVariant.WARNING]: {
      background: '#fef3c7',
      color: '#d97706',
    },
    [BadgeVariant.ERROR]: {
      background: '#fee2e2',
      color: '#dc2626',
    },
    [BadgeVariant.DEFAULT]: {
      background: theme.colors.gray[100],
      color: theme.colors.gray[700],
    },
  };
  
  return styles[variant];
};

const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  ${({ $variant, theme }) => {
    const styles = getVariantStyles($variant, theme);
    return `
      background: ${styles.background};
      color: ${styles.color};
    `;
  }}
`;

export default Badge;