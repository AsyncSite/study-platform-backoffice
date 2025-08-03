import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import Button, { ButtonVariant } from '../common/Button';
import type { StudyResponse } from '../../types/api';
import { StudyStatus } from '../../types/api';
import type { User } from '../../types/user';
import { usersApi } from '../../api/users';
import { formatDateKorean } from '../../utils/dateUtils';

interface StudyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: StudyResponse | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onTerminate?: (id: string) => void;
  onReactivate?: (id: string) => void;
}

const StudyDetailModal: React.FC<StudyDetailModalProps> = ({
  isOpen,
  onClose,
  study,
  onApprove,
  onReject,
  onTerminate,
  onReactivate,
}) => {
  const [proposerInfo, setProposerInfo] = useState<User | null>(null);
  const [loadingProposer, setLoadingProposer] = useState(false);

  useEffect(() => {
    if (study?.proposerId && isOpen) {
      fetchProposerInfo(study.proposerId);
    }
  }, [study?.proposerId, isOpen]);

  const fetchProposerInfo = async (userId: string) => {
    try {
      setLoadingProposer(true);
      const userDetail = await usersApi.getUserDetail(userId);
      setProposerInfo(userDetail);
    } catch (error) {
      console.error('Failed to fetch proposer info:', error);
    } finally {
      setLoadingProposer(false);
    }
  };

  if (!study) return null;

  const formatDate = formatDateKorean;

  const getStatusColor = (status: StudyStatus) => {
    const colors = {
      [StudyStatus.PENDING]: '#fbbf24',
      [StudyStatus.APPROVED]: '#10b981',
      [StudyStatus.REJECTED]: '#ef4444',
      [StudyStatus.TERMINATED]: '#6b7280',
    };
    return colors[status];
  };

  const getStatusText = (status: StudyStatus) => {
    const texts = {
      [StudyStatus.PENDING]: '대기중',
      [StudyStatus.APPROVED]: '승인됨',
      [StudyStatus.REJECTED]: '거절됨',
      [StudyStatus.TERMINATED]: '종료됨',
    };
    return texts[status];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="스터디 상세 정보"
      size="large"
    >
      <DetailContainer>
        <HeaderSection>
          <TitleRow>
            <TitleGroup>
              <StudyTitle>
                {study.title}
                {study.generation && (
                  <GenerationBadge>{study.generation}기</GenerationBadge>
                )}
              </StudyTitle>
              {study.tagline && <Tagline>{study.tagline}</Tagline>}
            </TitleGroup>
            <BadgeGroup>
              <StatusBadge $color={getStatusColor(study.status)}>
                {getStatusText(study.status)}
              </StatusBadge>
              {study.type && (
                <TypeBadge $type={study.type}>
                  {study.type === 'PARTICIPATORY' ? '참여형' : '교육형'}
                </TypeBadge>
              )}
            </BadgeGroup>
          </TitleRow>
        </HeaderSection>

        <InfoSection>
          <InfoGrid>
            <InfoItem>
              <Label>ID</Label>
              <Value>{study.id}</Value>
            </InfoItem>
            {study.slug && (
              <InfoItem>
                <Label>URL 식별자</Label>
                <Value>{study.slug}</Value>
              </InfoItem>
            )}
            <InfoItem>
              <Label>제안자</Label>
              <ProposerInfo>
                {loadingProposer ? (
                  <LoadingText>로딩 중...</LoadingText>
                ) : proposerInfo ? (
                  <ProposerDetails>
                    <ProposerName>{proposerInfo.name}</ProposerName>
                    <ProposerEmail>{proposerInfo.email}</ProposerEmail>
                    <ProposerRole>{proposerInfo.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}</ProposerRole>
                  </ProposerDetails>
                ) : (
                  <Value>{study.proposerId}</Value>
                )}
              </ProposerInfo>
            </InfoItem>
            {study.schedule && (
              <InfoItem>
                <Label>일정</Label>
                <Value>{study.schedule}</Value>
              </InfoItem>
            )}
            {study.duration && (
              <InfoItem>
                <Label>시간</Label>
                <Value>{study.duration}</Value>
              </InfoItem>
            )}
            {study.capacity && (
              <InfoItem>
                <Label>정원</Label>
                <Value>{study.enrolled || 0}/{study.capacity}명</Value>
              </InfoItem>
            )}
            {study.recruitDeadline && (
              <InfoItem>
                <Label>모집 마감일</Label>
                <Value>{formatDate(study.recruitDeadline, false)}</Value>
              </InfoItem>
            )}
            {study.startDate && (
              <InfoItem>
                <Label>시작일</Label>
                <Value>{formatDate(study.startDate, false)}</Value>
              </InfoItem>
            )}
            {study.endDate && (
              <InfoItem>
                <Label>종료일</Label>
                <Value>{formatDate(study.endDate, false)}</Value>
              </InfoItem>
            )}
            <InfoItem>
              <Label>생성일</Label>
              <Value>{formatDate(study.createdAt)}</Value>
            </InfoItem>
            <InfoItem>
              <Label>최종 수정일</Label>
              <Value>{formatDate(study.updatedAt)}</Value>
            </InfoItem>
          </InfoGrid>
        </InfoSection>

        <DescriptionSection>
          <Label>설명</Label>
          <Description>{study.description}</Description>
        </DescriptionSection>

        {study.status === StudyStatus.REJECTED && study.rejectionReason && (
          <RejectionSection>
            <Label>거절 사유</Label>
            <RejectionReason>{study.rejectionReason}</RejectionReason>
          </RejectionSection>
        )}

        <ActionSection>
          {study.status === StudyStatus.PENDING && (
            <>
              <Button
                variant={ButtonVariant.SUCCESS}
                onClick={() => onApprove?.(study.id)}
              >
                승인
              </Button>
              <Button
                variant={ButtonVariant.DANGER}
                onClick={() => onReject?.(study.id)}
              >
                거절
              </Button>
            </>
          )}
          {study.status === StudyStatus.APPROVED && (
            <Button
              variant={ButtonVariant.DANGER}
              onClick={() => onTerminate?.(study.id)}
            >
              종료
            </Button>
          )}
          {study.status === StudyStatus.TERMINATED && (
            <Button
              variant={ButtonVariant.PRIMARY}
              onClick={() => onReactivate?.(study.id)}
            >
              재활성화
            </Button>
          )}
          <Button
            variant={ButtonVariant.SECONDARY}
            onClick={onClose}
          >
            닫기
          </Button>
        </ActionSection>
      </DetailContainer>
    </Modal>
  );
};

const DetailContainer = styled.div`
  padding: 20px;
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  flex: 1;
`;

const StudyTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const GenerationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
`;

const Tagline = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: ${({ $color }) => $color};
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary}20;
  color: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const InfoSection = styled.div`
  margin-bottom: 24px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
`;

const Value = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-all;
`;

const DescriptionSection = styled.div`
  margin-bottom: 24px;
`;

const Description = styled.p`
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: pre-wrap;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ProposerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LoadingText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

const ProposerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProposerName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProposerEmail = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProposerRole = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

const RejectionSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  border-radius: 8px;
`;

const RejectionReason = styled.p`
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.error};
  white-space: pre-wrap;
`;

export default StudyDetailModal;