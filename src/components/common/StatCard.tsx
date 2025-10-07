import React from 'react';
import styled from 'styled-components';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {trend && (
          <TrendBadge $isPositive={trend.isPositive}>
            <TrendIcon>{trend.isPositive ? '↑' : '↓'}</TrendIcon>
            {Math.abs(trend.value)}%
          </TrendBadge>
        )}
      </CardHeader>
      <CardValue>{value}</CardValue>
      {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
    </Card>
  );
};

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TrendBadge = styled.span<{ $isPositive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $isPositive, theme }) =>
    $isPositive ? theme.colors.success : theme.colors.error};
  background: ${({ $isPositive, theme }) =>
    $isPositive ? theme.colors.success + '10' : theme.colors.error + '10'};
  padding: 4px 8px;
  border-radius: 12px;
`;

const TrendIcon = styled.span`
  font-size: 10px;
`;

const CardValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 8px;
`;

const CardSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export default StatCard;