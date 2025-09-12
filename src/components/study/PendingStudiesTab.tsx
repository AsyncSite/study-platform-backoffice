import React from 'react';
import styled from 'styled-components';
import StudyCard from './StudyCard';
import { Clock, AlertCircle } from 'lucide-react';
import type { StudyResponse } from '../../types/api';

interface PendingStudiesTabProps {
  studies: StudyResponse[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
}

const PendingStudiesTab: React.FC<PendingStudiesTabProps> = ({
  studies,
  loading,
  onApprove,
  onReject,
  onView,
}) => {
  const calculateWaitTime = (createdAt: string | number[]) => {
    const now = new Date();
    const created = Array.isArray(createdAt)
      ? new Date(createdAt[0], createdAt[1] - 1, createdAt[2])
      : new Date(createdAt);
    
    const diff = now.getTime() - created.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}일 ${hours % 24}시간`;
    }
    return `${hours}시간`;
  };

  if (loading) {
    return (
      <LoadingMessage>
        승인 대기 중인 스터디를 불러오는 중...
      </LoadingMessage>
    );
  }

  if (studies.length === 0) {
    return (
      <EmptyState>
        <AlertCircle size={48} />
        <EmptyTitle>승인 대기 중인 스터디가 없습니다</EmptyTitle>
        <EmptyDescription>
          사용자들이 새로운 스터디를 신청하면 여기에 표시됩니다.
        </EmptyDescription>
      </EmptyState>
    );
  }

  return (
    <Container>
      <Stats>
        <StatCard>
          <StatIcon>
            <Clock size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>평균 대기 시간</StatLabel>
            <StatValue>
              {studies.length > 0
                ? Math.floor(
                    studies.reduce((acc, study) => {
                      const created = Array.isArray(study.createdAt)
                        ? new Date(study.createdAt[0], study.createdAt[1] - 1, study.createdAt[2])
                        : new Date(study.createdAt);
                      return acc + (new Date().getTime() - created.getTime());
                    }, 0) / studies.length / (1000 * 60 * 60)
                  ) + '시간'
                : '0시간'}
            </StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatContent>
            <StatLabel>오늘 신청</StatLabel>
            <StatValue>
              {studies.filter(s => {
                const created = Array.isArray(s.createdAt)
                  ? new Date(s.createdAt[0], s.createdAt[1] - 1, s.createdAt[2])
                  : new Date(s.createdAt);
                return created.toDateString() === new Date().toDateString();
              }).length}건
            </StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatContent>
            <StatLabel>이번 주 신청</StatLabel>
            <StatValue>
              {studies.filter(s => {
                const created = Array.isArray(s.createdAt)
                  ? new Date(s.createdAt[0], s.createdAt[1] - 1, s.createdAt[2])
                  : new Date(s.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return created > weekAgo;
              }).length}건
            </StatValue>
          </StatContent>
        </StatCard>
      </Stats>

      <StudyGrid>
        {studies.map((study) => (
          <StudyCardWrapper key={study.id}>
            <WaitingTime>
              <Clock size={16} />
              대기 시간: {calculateWaitTime(study.createdAt)}
            </WaitingTime>
            <StudyCard
              study={study}
              onApprove={onApprove}
              onReject={onReject}
              onView={onView}
            />
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

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.warning}15;
  color: ${({ theme }) => theme.colors.warning};
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

const StudyCardWrapper = styled.div`
  position: relative;
`;

const WaitingTime = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  top: -10px;
  right: 16px;
  background: ${({ theme }) => theme.colors.warning};
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export default PendingStudiesTab;