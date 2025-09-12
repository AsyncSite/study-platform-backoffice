import React from 'react';
import styled from 'styled-components';
import Card from '../common/Card';
import Badge, { BadgeVariant } from '../common/Badge';
import Button, { ButtonVariant, ButtonSize } from '../common/Button';
import type { StudyResponse } from '../../types/api';
import { StudyStatus } from '../../types/api';
import { formatDate } from '../../utils/dateUtils';

interface StudyCardProps {
  study: StudyResponse;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onTerminate?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  customActions?: React.ReactNode;
}

const StudyCard: React.FC<StudyCardProps> = ({
  study,
  onApprove,
  onReject,
  onTerminate,
  onView,
  onDelete,
  customActions,
}) => {
  const getStatusBadgeVariant = (status: StudyStatus): BadgeVariant => {
    const variants: Record<StudyStatus, BadgeVariant> = {
      [StudyStatus.PENDING]: BadgeVariant.WARNING,
      [StudyStatus.APPROVED]: BadgeVariant.SUCCESS,
      [StudyStatus.IN_PROGRESS]: BadgeVariant.SUCCESS,
      [StudyStatus.COMPLETED]: BadgeVariant.DEFAULT,
      [StudyStatus.REJECTED]: BadgeVariant.ERROR,
      [StudyStatus.TERMINATED]: BadgeVariant.DEFAULT,
    };
    return variants[status];
  };

  const getStatusText = (status: StudyStatus): string => {
    const texts: Record<StudyStatus, string> = {
      [StudyStatus.PENDING]: '대기중',
      [StudyStatus.APPROVED]: '진행중',
      [StudyStatus.IN_PROGRESS]: '진행중',
      [StudyStatus.COMPLETED]: '완료됨',
      [StudyStatus.REJECTED]: '거절됨',
      [StudyStatus.TERMINATED]: '종료됨',
    };
    return texts[status];
  };

  type CardVariant = 'pending' | 'active' | 'rejected' | 'terminated';

  const getCardVariant = (status: StudyStatus): CardVariant => {
    const variantMap: Record<StudyStatus, CardVariant> = {
      [StudyStatus.PENDING]: 'pending',
      [StudyStatus.APPROVED]: 'active',
      [StudyStatus.IN_PROGRESS]: 'active',
      [StudyStatus.COMPLETED]: 'terminated',
      [StudyStatus.REJECTED]: 'rejected',
      [StudyStatus.TERMINATED]: 'terminated',
    };
    return variantMap[status];
  };


  return (
    <StyledStudyCard $variant={getCardVariant(study.status)} $deleted={study.deleted}>
      {study.deleted && <DeletedOverlay>삭제된 스터디</DeletedOverlay>}
      <CardHeader $variant={getCardVariant(study.status)} />
      <CardContent>
        <CardTitle>
          {study.title}
          {study.generation && <GenerationBadge>{study.generation}기</GenerationBadge>}
          {study.deleted && <DeletedBadge>삭제됨</DeletedBadge>}
        </CardTitle>
        {study.tagline && <CardTagline>{study.tagline}</CardTagline>}
        <CardId>ID: {study.id}</CardId>
        
        <StatusBadge variant={getStatusBadgeVariant(study.status)}>
          {getStatusText(study.status)}
        </StatusBadge>
        
        {study.type && (
          <TypeBadge $type={study.type}>
            {study.type === 'PARTICIPATORY' ? '참여형' : '교육형'}
          </TypeBadge>
        )}
        
        <CardInfo>제안자: {study.proposerId}</CardInfo>
        {study.schedule && <CardInfo>일정: {study.schedule}</CardInfo>}
        {study.capacity && (
          <CardInfo>
            정원: {study.enrolled || 0}/{study.capacity}명
            {study.capacity === study.enrolled && ' (마감)'}
          </CardInfo>
        )}
        {study.recruitDeadline && (
          <CardInfo>
            모집 마감: {formatDate(study.recruitDeadline, false)}
          </CardInfo>
        )}
        <CardInfo>
          {study.status === StudyStatus.PENDING ? '제안일' : '수정일'}: {formatDate(study.updatedAt)}
        </CardInfo>
        
        {study.status === StudyStatus.REJECTED && study.rejectionReason && (
          <RejectReason>거절 사유: {study.rejectionReason}</RejectReason>
        )}
        
        <CardActions>
          <Button
              variant={ButtonVariant.PRIMARY}
              size={ButtonSize.SMALL}
              onClick={() => onView?.(study.id)}
              fullWidth
          >
            상세보기
          </Button>
          {study.status === StudyStatus.PENDING && !study.deleted && (
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
          
          {study.status === StudyStatus.APPROVED && !study.deleted && (
              <Button
                variant={ButtonVariant.SECONDARY}
                size={ButtonSize.SMALL}
                onClick={() => onTerminate?.(study.id)}
                fullWidth
              >
                종료
              </Button>
          )}
          {study.deleted && (
            <DeletedMessage>
              삭제된 스터디입니다
            </DeletedMessage>
          )}
          {customActions}
        </CardActions>
      </CardContent>
    </StyledStudyCard>
  );
};

const StyledStudyCard = styled(Card)<{ $variant: 'pending' | 'active' | 'rejected' | 'terminated'; $deleted?: boolean }>`
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
  
  ${({ $deleted }) => $deleted && `
    opacity: 0.7;
    filter: grayscale(50%);
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const CardHeader = styled.div<{ $variant: 'pending' | 'active' | 'rejected' | 'terminated' }>`
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const GenerationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
`;

const CardTagline = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 8px;
  font-style: italic;
`;

const CardId = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 15px;
`;

const StatusBadge = styled(Badge)`
  margin-bottom: 10px;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 4px 10px;
  background: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary}20;
  color: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 15px;
`;

const CardInfo = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 5px;
`;

const RejectReason = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.error};
  margin-top: 10px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.error}10;
  border-radius: 6px;
  border-left: 3px solid ${({ theme }) => theme.colors.error};
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const DeletedOverlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-bottom-left-radius: 8px;
  z-index: 10;
`;

const DeletedBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
  vertical-align: middle;
`;

const DeletedMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 14px;
  padding: 20px;
  font-style: italic;
`;

export default StudyCard;