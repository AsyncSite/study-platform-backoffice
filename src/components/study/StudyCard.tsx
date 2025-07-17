import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';
import Badge, { BadgeVariant } from '../common/Badge';
import Button, { ButtonVariant, ButtonSize } from '../common/Button';
import type { StudyResponse } from '../../types/api';
import { StudyStatus } from '../../types/api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StudyCardProps {
  study: StudyResponse;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onTerminate?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const StudyCard: React.FC<StudyCardProps> = ({
  study,
  onApprove,
  onReject,
  onTerminate,
  onView,
  onDelete,
}) => {
  const getStatusBadgeVariant = (status: StudyStatus): BadgeVariant => {
    const variants = {
      [StudyStatus.PENDING]: BadgeVariant.WARNING,
      [StudyStatus.APPROVED]: BadgeVariant.SUCCESS,
      [StudyStatus.REJECTED]: BadgeVariant.ERROR,
      [StudyStatus.TERMINATED]: BadgeVariant.DEFAULT,
    };
    return variants[status];
  };

  const getStatusText = (status: StudyStatus): string => {
    const texts = {
      [StudyStatus.PENDING]: '대기중',
      [StudyStatus.APPROVED]: '진행중',
      [StudyStatus.REJECTED]: '거절됨',
      [StudyStatus.TERMINATED]: '종료됨',
    };
    return texts[status];
  };

  const getCardVariant = (status: StudyStatus) => {
    return status.toLowerCase() as 'pending' | 'active' | 'rejected' | 'terminated';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy.MM.dd HH:mm', { locale: ko });
  };

  return (
    <StyledStudyCard $variant={getCardVariant(study.status)}>
      <CardHeader $variant={getCardVariant(study.status)} />
      <CardContent>
        <CardTitle>{study.title}</CardTitle>
        <CardId>ID: {study.id}</CardId>
        
        <StatusBadge variant={getStatusBadgeVariant(study.status)}>
          {getStatusText(study.status)}
        </StatusBadge>
        
        <CardInfo>제안자: {study.proposerId}</CardInfo>
        <CardInfo>
          {study.status === StudyStatus.PENDING ? '제안일' : '수정일'}: {formatDate(study.updatedAt)}
        </CardInfo>
        
        {study.status === StudyStatus.REJECTED && (
          <RejectReason>사유: 중복된 주제</RejectReason>
        )}
        
        <CardActions>
          {study.status === StudyStatus.PENDING && (
            <>
              <Button
                variant={ButtonVariant.SUCCESS}
                size={ButtonSize.SMALL}
                onClick={() => onApprove?.(study.id)}
                fullWidth
              >
                승인
              </Button>
              <Button
                variant={ButtonVariant.ERROR}
                size={ButtonSize.SMALL}
                onClick={() => onReject?.(study.id)}
                fullWidth
              >
                거절
              </Button>
            </>
          )}
          
          {study.status === StudyStatus.APPROVED && (
            <>
              <Button
                variant={ButtonVariant.PRIMARY}
                size={ButtonSize.SMALL}
                onClick={() => onView?.(study.id)}
                fullWidth
              >
                상세보기
              </Button>
              <Button
                variant={ButtonVariant.SECONDARY}
                size={ButtonSize.SMALL}
                onClick={() => onTerminate?.(study.id)}
                fullWidth
              >
                종료
              </Button>
            </>
          )}
          
          {(study.status === StudyStatus.REJECTED || study.status === StudyStatus.TERMINATED) && (
            <Button
              variant={ButtonVariant.GHOST}
              size={ButtonSize.SMALL}
              onClick={() => onDelete?.(study.id)}
              fullWidth
            >
              삭제
            </Button>
          )}
        </CardActions>
      </CardContent>
    </StyledStudyCard>
  );
};

const StyledStudyCard = styled(Card)<{ $variant: string }>`
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  padding: 0;
  transition: ${({ theme }) => theme.transitions.normal};
  
  ${({ $variant, theme }) => {
    const styles = {
      pending: `
        background: #fffbeb;
        border: 1px solid #fbbf24;
      `,
      active: `
        background: #ecfdf5;
        border: 1px solid ${theme.colors.success};
      `,
      rejected: `
        background: #fef2f2;
        border: 1px solid ${theme.colors.error};
      `,
      terminated: `
        background: ${theme.colors.gray[50]};
        border: 1px solid ${theme.colors.gray[300]};
      `,
    };
    return styles[$variant as keyof typeof styles] || '';
  }}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const CardHeader = styled.div<{ $variant: string }>`
  height: 12px;
  background: ${({ $variant, theme }) => {
    const colors = {
      pending: '#fbbf24',
      active: theme.colors.success,
      rejected: theme.colors.error,
      terminated: theme.colors.gray[400],
    };
    return colors[$variant as keyof typeof colors] || theme.colors.gray[400];
  }};
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CardId = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 15px;
`;

const StatusBadge = styled(Badge)`
  margin-bottom: 20px;
`;

const CardInfo = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 5px;
`;

const RejectReason = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: 10px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

export default StudyCard;