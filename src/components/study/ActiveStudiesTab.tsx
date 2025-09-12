import React from 'react';
import styled from 'styled-components';
import StudyCard from './StudyCard';
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react';
import type { StudyResponse } from '../../types/api';
import { StudyStatus } from '../../types/api';

interface ActiveStudiesTabProps {
  studies: StudyResponse[];
  loading: boolean;
  onTerminate: (id: string) => void;
  onView: (id: string) => void;
  onManageApplications: (study: StudyResponse) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const ActiveStudiesTab: React.FC<ActiveStudiesTabProps> = ({
  studies,
  loading,
  onTerminate,
  onView,
  onManageApplications,
  onStart,
  onComplete,
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
          <StudyCard
            key={study.id}
            study={study}
            onTerminate={onTerminate}
            onView={onView}
            showParticipantInfo={true}
            customActions={
              <>
                {/* 스터디 상태에 따른 액션 버튼 */}
                {study.status === StudyStatus.APPROVED && onStart && (
                  <ActionButton
                    onClick={() => onStart(study.id)}
                    $variant="success"
                  >
                    스터디 시작
                  </ActionButton>
                )}
                {study.status === StudyStatus.IN_PROGRESS && onComplete && (
                  <ActionButton
                    onClick={() => onComplete(study.id)}
                    $variant="info"
                  >
                    스터디 완료
                  </ActionButton>
                )}
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
  max-width: 400px;
  margin: 0 auto;

  svg {
    color: ${({ theme }) => theme.colors.text.disabled};
    margin-bottom: 24px;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.2s;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.medium};
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    gap: 12px;
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'primary': return theme.colors.primary + '15';
      case 'success': return theme.colors.success + '15';
      case 'info': return theme.colors.info + '15';
      default: return theme.colors.secondary + '15';
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
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
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
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 16px;
  }
`;

const ApplicationButton = styled.button<{ $hasApplications: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 36px;
  background: ${({ theme, $hasApplications }) => 
    $hasApplications ? theme.colors.primary : theme.colors.gray[100]};
  color: ${({ theme, $hasApplications }) => 
    $hasApplications ? 'white' : theme.colors.text.primary};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActionButton = styled.button<{ $variant: 'success' | 'info' | 'warning' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 36px;
  
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'success': return theme.colors.success;
      case 'info': return theme.colors.info;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.primary;
    }
  }};
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

export default ActiveStudiesTab;