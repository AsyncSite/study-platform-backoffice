import React from 'react';
import styled from 'styled-components';
import StudyCard from './StudyCard';
import { XCircle, RotateCcw, Trash2 } from 'lucide-react';
import type { StudyResponse } from '../../types/api';
import { StudyStatus } from '../../types/api';

interface InactiveStudiesTabProps {
  studies: StudyResponse[];
  loading: boolean;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const InactiveStudiesTab: React.FC<InactiveStudiesTabProps> = ({
  studies,
  loading,
  onReactivate,
  onDelete,
  onView,
}) => {
  if (loading) {
    return (
      <LoadingMessage>
        비활성 스터디를 불러오는 중...
      </LoadingMessage>
    );
  }

  if (studies.length === 0) {
    return (
      <EmptyState>
        <XCircle size={48} />
        <EmptyTitle>비활성 스터디가 없습니다</EmptyTitle>
        <EmptyDescription>
          종료되거나 거절된 스터디가 여기에 표시됩니다.
        </EmptyDescription>
      </EmptyState>
    );
  }

  const rejectedCount = studies.filter(s => s.status === StudyStatus.REJECTED).length;
  const terminatedCount = studies.filter(s => s.status === StudyStatus.TERMINATED).length;

  return (
    <Container>
      <Stats>
        <StatCard>
          <StatIcon $color="danger">
            <XCircle size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>거절된 스터디</StatLabel>
            <StatValue>{rejectedCount}개</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="secondary">
            <XCircle size={24} />
          </StatIcon>
          <StatContent>
            <StatLabel>종료된 스터디</StatLabel>
            <StatValue>{terminatedCount}개</StatValue>
          </StatContent>
        </StatCard>
      </Stats>

      <StudyGrid>
        {studies.map((study) => (
          <StudyCardWrapper key={study.id}>
            <StatusIndicator $status={study.status}>
              {study.status === StudyStatus.REJECTED ? '거절됨' : '종료됨'}
            </StatusIndicator>
            <StudyCard
              study={study}
              onDelete={onDelete}
              onView={onView}
              customActions={
                <ActionButtons>
                  {study.status === StudyStatus.TERMINATED && (
                    <ActionButton onClick={() => onReactivate(study.id)}>
                      <RotateCcw size={16} />
                      재활성화
                    </ActionButton>
                  )}
                  <ActionButton $danger onClick={() => onDelete(study.id)}>
                    <Trash2 size={16} />
                    영구 삭제
                  </ActionButton>
                </ActionButtons>
              }
            />
            {study.status === StudyStatus.REJECTED && study.rejectionReason && (
              <RejectionReason>
                <strong>거절 사유:</strong> {study.rejectionReason}
              </RejectionReason>
            )}
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
      case 'danger': return theme.colors.danger + '20';
      case 'secondary': return theme.colors.secondary + '20';
      default: return theme.colors.secondary + '20';
    }
  }};
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'danger': return theme.colors.danger;
      case 'secondary': return theme.colors.secondary;
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

const StatusIndicator = styled.div<{ $status: StudyStatus }>`
  position: absolute;
  top: -10px;
  left: 16px;
  background: ${({ theme, $status }) => 
    $status === StudyStatus.REJECTED ? theme.colors.danger : theme.colors.secondary};
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
`;

const RejectionReason = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}20;
  border-radius: 0 0 8px 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.danger};
  margin-top: -8px;

  strong {
    font-weight: 600;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme, $danger }) => 
    $danger ? theme.colors.danger + '10' : theme.colors.secondary + '10'};
  color: ${({ theme, $danger }) => 
    $danger ? theme.colors.danger : theme.colors.text.primary};
  border: 1px solid ${({ theme, $danger }) => 
    $danger ? theme.colors.danger + '20' : theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme, $danger }) => 
      $danger ? theme.colors.danger + '20' : theme.colors.secondary + '20'};
  }
`;

export default InactiveStudiesTab;