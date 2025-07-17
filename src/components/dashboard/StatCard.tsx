import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
    description: string;
  };
  barColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, barColor }) => {
  return (
    <StyledStatCard>
      <StatCardBar $color={barColor} />
      <StatLabel>{label}</StatLabel>
      <StatValue>{value}</StatValue>
      {change && (
        <StatChange $positive={change.positive}>
          <span>{change.positive ? '▲' : '▼'} {change.value}</span>
          <StatDescription>{change.description}</StatDescription>
        </StatChange>
      )}
    </StyledStatCard>
  );
};

const StyledStatCard = styled(Card)`
  position: relative;
  overflow: hidden;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StatCardBar = styled.div<{ $color?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: ${({ $color, theme }) => $color || theme.gradients.primary};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 10px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatChange = styled.div<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${({ $positive, theme }) => 
    $positive ? theme.colors.success : theme.colors.error};
`;

const StatDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

export default StatCard;