import React from 'react';
import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

const Card: React.FC<CardProps> = ({ children, className, padding }) => {
  return (
    <StyledCard className={className} $padding={padding}>
      {children}
    </StyledCard>
  );
};

const StyledCard = styled.div<{ $padding?: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ $padding }) => $padding || '20px'};
`;

export default Card;