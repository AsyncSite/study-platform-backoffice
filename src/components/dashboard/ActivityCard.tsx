import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';

interface Activity {
  id: string;
  type: 'new-member' | 'study-apply' | 'payment' | 'urgent';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityCardProps {
  activities: Activity[];
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activities }) => {
  const getActivityColor = (type: Activity['type']) => {
    const colors = {
      'new-member': '#6366f1',
      'study-apply': '#10b981',
      'payment': '#f59e0b',
      'urgent': '#ef4444',
    };
    return colors[type];
  };

  return (
    <StyledCard>
      <ActivityHeader>
        <ActivityTitle>실시간 활동</ActivityTitle>
        <ActivityRefresh>새로고침</ActivityRefresh>
      </ActivityHeader>
      
      <ActivityList>
        {activities.map((activity) => (
          <ActivityItem key={activity.id}>
            <ActivityDot $color={getActivityColor(activity.type)} />
            <ActivityContent>
              <ActivityTitleText>{activity.title}</ActivityTitleText>
              <ActivityDescription>{activity.description}</ActivityDescription>
            </ActivityContent>
            <ActivityTime>{activity.timestamp}</ActivityTime>
          </ActivityItem>
        ))}
      </ActivityList>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ActivityTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const ActivityRefresh = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const ActivityDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitleText = styled.div`
  font-size: 12px;
  margin-bottom: 3px;
`;

const ActivityDescription = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ActivityTime = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: auto;
  flex-shrink: 0;
`;

export default ActivityCard;