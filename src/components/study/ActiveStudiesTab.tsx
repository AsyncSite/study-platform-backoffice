import React from 'react';
import styled from 'styled-components';
import StudyCard from './StudyCard';
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react';
import type { StudyResponse } from '../../types/api';

interface ActiveStudiesTabProps {
  studies: StudyResponse[];
  loading: boolean;
  onTerminate: (id: string) => void;
  onView: (id: string) => void;
  onManageApplications: (study: StudyResponse) => void;
}

const ActiveStudiesTab: React.FC<ActiveStudiesTabProps> = ({
  studies,
  loading,
  onTerminate,
  onView,
  onManageApplications,
}) => {
  if (loading) {
    return (
      <LoadingMessage>
        활성 스터디를 불러오는 중...
      </LoadingMessage>
    );
  }

  if (studies.length === 0) {
    return (
      <EmptyState>
        <Activity size={48} />
        <EmptyTitle>활성 스터디가 없습니다</EmptyTitle>
        <EmptyDescription>
          승인된 스터디가 여기에 표시됩니다.
        </EmptyDescription>
      </EmptyState>
    );
  }

  // 통계 계산
  const totalParticipants = studies.reduce((acc, study) => acc + (study.enrolled || 0), 0);
  const totalCapacity = studies.reduce((acc, study) => acc + (study.capacity || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0;

  return (
    <Container>
      <Stats>
        <StatCard>
          <StatIcon $color="primary">
            <Activity size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>전체 활성 스터디</StatLabel>
            <StatValue>{studies.length}개</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="success">
            <Users size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>전체 참여자</StatLabel>
            <StatValue>{totalParticipants}명</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="info">
            <TrendingUp size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>평균 충원율</StatLabel>
            <StatValue>{fillRate}%</StatValue>
          </StatContent>
        </StatCard>
      </Stats>

      <StudyGrid>
        {studies.map((study) => (
          <StudyCardWrapper key={study.id}>
            <StudyCard
              study={study}
              onTerminate={onTerminate}
              onView={onView}
              customActions={
                <>
                  {/* TODO: 실제 대기 중인 신청 수를 API에서 가져와야 함 */}
                  <ApplicationButton
                    onClick={() => onManageApplications(study)}
                    $hasApplications={false}
                  >
                    <UserPlus size={16} />
                    참여 신청 관리
                    {/* {pendingApplications > 0 && (
                      <ApplicationBadge>{pendingApplications}</ApplicationBadge>
                    )} */}
                  </ApplicationButton>
                </>
              }
            />
            <StudyInfo>
              <InfoItem>
                <Users size={16} />
                <span>
                  {study.enrolled || 0}/{study.capacity || '∞'} 명
                </span>
              </InfoItem>
              {study.generation && (
                <InfoItem>
                  <span>기수: {study.generation}</span>
                </InfoItem>
              )}
            </StudyInfo>
          </StudyCardWrapper>
        ))}
      </StudyGrid>
    </Container>
  );
};

const Container = styled.div``;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: ${({ theme }) => theme.colors.text.secondary};

  svg {
    color: ${({ theme }) => theme.colors.text.disabled};
    margin-bottom: 16px;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const EmptyDescription = styled.p`
  font-size: 16px;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'primary': return theme.colors.primary + '20';
      case 'success': return theme.colors.success + '20';
      case 'info': return theme.colors.info + '20';
      default: return theme.colors.secondary + '20';
    }
  }};
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'primary': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'info': return theme.colors.info;
      default: return theme.colors.secondary;
    }
  }};
  border-radius: 12px;
`;

const StatContent = styled.div``;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StudyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const StudyCardWrapper = styled.div`
  position: relative;
`;

const StudyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0 0 8px 8px;
  margin-top: -8px;
  position: relative;
  z-index: 0;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};

  svg {
    color: ${({ theme }) => theme.colors.text.disabled};
  }
`;

const ApplicationButton = styled.button<{ $hasApplications: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme, $hasApplications }) => 
    $hasApplications ? theme.colors.primary : theme.colors.gray[50]};
  color: ${({ theme, $hasApplications }) => 
    $hasApplications ? 'white' : theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;


export default ActiveStudiesTab;