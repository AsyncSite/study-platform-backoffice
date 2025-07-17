import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

interface StatusDistribution {
  approved: number;
  pending: number;
  rejected: number;
}

interface StudyStatusOverviewProps {
  pendingCount: number;
  distribution: StatusDistribution;
}

const StudyStatusOverview: React.FC<StudyStatusOverviewProps> = ({ 
  pendingCount, 
  distribution 
}) => {
  const total = distribution.approved + distribution.pending + distribution.rejected;
  
  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <StyledCard>
      <OverviewTitle>실시간 현황</OverviewTitle>
      
      <PendingAlert>
        <AlertIcon>⚠️</AlertIcon>
        <AlertContent>
          <AlertTitle>승인 대기</AlertTitle>
          <AlertCount>{pendingCount}건</AlertCount>
        </AlertContent>
        <AlertAction>즉시처리</AlertAction>
      </PendingAlert>
      
      <StatusDistribution>
        <DistributionTitle>상태별 분포</DistributionTitle>
        
        <StatusItem>
          <StatusHeader>
            <StatusName>승인됨 ({distribution.approved})</StatusName>
            <StatusPercent>{getPercentage(distribution.approved)}%</StatusPercent>
          </StatusHeader>
          <StatusBar>
            <StatusFill 
              $type="approved" 
              $width={getPercentage(distribution.approved)} 
            />
          </StatusBar>
        </StatusItem>
        
        <StatusItem>
          <StatusHeader>
            <StatusName>대기중 ({distribution.pending})</StatusName>
            <StatusPercent>{getPercentage(distribution.pending)}%</StatusPercent>
          </StatusHeader>
          <StatusBar>
            <StatusFill 
              $type="pending" 
              $width={getPercentage(distribution.pending)} 
            />
          </StatusBar>
        </StatusItem>
        
        <StatusItem>
          <StatusHeader>
            <StatusName>거절됨 ({distribution.rejected})</StatusName>
            <StatusPercent>{getPercentage(distribution.rejected)}%</StatusPercent>
          </StatusHeader>
          <StatusBar>
            <StatusFill 
              $type="rejected" 
              $width={getPercentage(distribution.rejected)} 
            />
          </StatusBar>
        </StatusItem>
      </StatusDistribution>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  padding: 20px;
`;

const OverviewTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const PendingAlert = styled.div`
  background: #fef3c7;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;

const AlertIcon = styled.div`
  font-size: 24px;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #92400e;
`;

const AlertCount = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #92400e;
`;

const AlertAction = styled.div`
  font-size: 12px;
  color: #92400e;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusDistribution = styled.div`
  margin-bottom: 30px;
`;

const DistributionTitle = styled.h4`
  font-size: 14px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 20px;
`;

const StatusItem = styled.div`
  margin-bottom: 15px;
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const StatusName = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatusPercent = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatusBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 4px;
  overflow: hidden;
`;

const StatusFill = styled.div<{ $type: string; $width: number }>`
  height: 100%;
  border-radius: 4px;
  width: ${({ $width }) => $width}%;
  transition: width 0.3s ease;
  background: ${({ $type, theme }) => {
    const colors = {
      approved: theme.colors.success,
      pending: theme.colors.warning,
      rejected: theme.colors.error,
    };
    return colors[$type as keyof typeof colors] || theme.colors.gray[400];
  }};
`;

export default StudyStatusOverview;