import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

export interface Activity {
  id: string;
  type: 'approved' | 'pending' | 'rejected';
  title: string;
  timestamp: string;
}

interface StudyRecentActivityProps {
  activities: Activity[];
}

const StudyRecentActivity: React.FC<StudyRecentActivityProps> = ({ activities }) => {
  return (
    <StyledCard>
      <ActivityTitle>최근 활동</ActivityTitle>
      
      <ActivityList>
        {activities.map((activity) => (
          <ActivityItem key={activity.id}>
            <ActivityIndicator $type={activity.type} />
            <ActivityInfo>
              <ActivityText>{activity.title}</ActivityText>
              <ActivityTimestamp>{activity.timestamp}</ActivityTimestamp>
            </ActivityInfo>
          </ActivityItem>
        ))}
      </ActivityList>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  padding: 20px;
`;

const ActivityTitle = styled.h4`
  font-size: 14px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 20px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ActivityItem = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 15px;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ActivityIndicator = styled.div<{ $type: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
  background: ${({ $type, theme }) => {
    const colors = {
      approved: theme.colors.success,
      pending: theme.colors.warning,
      rejected: theme.colors.error,
    };
    return colors[$type as keyof typeof colors] || theme.colors.gray[400];
  }};
`;

const ActivityInfo = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-size: 12px;
  margin-bottom: 3px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActivityTimestamp = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

export default StudyRecentActivity;