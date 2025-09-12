import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
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
    const colors: Record<StudyStatus, string> = {
      [StudyStatus.PENDING]: '#fbbf24',
      [StudyStatus.APPROVED]: '#10b981',
      [StudyStatus.IN_PROGRESS]: '#10b981',
      [StudyStatus.COMPLETED]: '#6b7280',
      [StudyStatus.REJECTED]: '#ef4444',
      [StudyStatus.TERMINATED]: '#6b7280',
    };
    return colors[status];
  };

  const getStatusText = (status: StudyStatus) => {
    const texts: Record<StudyStatus, string> = {
      [StudyStatus.PENDING]: '대기중',
      [StudyStatus.APPROVED]: '승인됨',
      [StudyStatus.IN_PROGRESS]: '진행중',
      [StudyStatus.COMPLETED]: '완료됨',
      [StudyStatus.REJECTED]: '거절됨',
      [StudyStatus.TERMINATED]: '종료됨',
    };
    return texts[status];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="large"
    >
      <DetailContainer>
        {/* Header with Title and Status */}
        <HeaderCard>
          <HeaderTop>
            <TitleSection>
              <StudyTitle>
                {study.title}
                {study.generation && (
                  <GenerationBadge>{study.generation}기</GenerationBadge>
                )}
              </StudyTitle>
              {study.tagline && <Tagline>"{study.tagline}"</Tagline>}
            </TitleSection>
            <StatusSection>
              <StatusBadge $color={getStatusColor(study.status)}>
                {getStatusText(study.status)}
              </StatusBadge>
              {study.type && (
                <TypeBadge $type={study.type}>
                  {study.type === 'PARTICIPATORY' ? '참여형' : '교육형'}
                </TypeBadge>
              )}
            </StatusSection>
          </HeaderTop>
          
          {/* Quick Stats */}
          <QuickStats>
            {study.capacity && (
              <StatItem>
                <StatLabel>참여자</StatLabel>
                <StatValue>{study.enrolled || 0}/{study.capacity}명</StatValue>
              </StatItem>
            )}
            {study.schedule && (
              <StatItem>
                <StatLabel>일정</StatLabel>
                <StatValue>{study.schedule}</StatValue>
              </StatItem>
            )}
            {study.duration && (
              <StatItem>
                <StatLabel>시간</StatLabel>
                <StatValue>{study.duration}</StatValue>
              </StatItem>
            )}
          </QuickStats>
        </HeaderCard>

        {/* Main Content Grid */}
        <ContentGrid>
          {/* Left Column - Basic Info */}
          <InfoCard>
            <CardTitle>기본 정보</CardTitle>
            <InfoList>
              <InfoRow>
                <InfoLabel>제안자</InfoLabel>
                <InfoValue>
                  {loadingProposer ? (
                    <LoadingText>로딩 중...</LoadingText>
                  ) : proposerInfo ? (
                    <ProposerDetails>
                      <ProposerName>{proposerInfo.name}</ProposerName>
                      <ProposerEmail>{proposerInfo.email}</ProposerEmail>
                      <ProposerRole>{proposerInfo.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}</ProposerRole>
                    </ProposerDetails>
                  ) : (
                    <span>{study.proposerId}</span>
                  )}
                </InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>스터디 ID</InfoLabel>
                <InfoValue><CodeText>{study.id}</CodeText></InfoValue>
              </InfoRow>
              
              {study.slug && (
                <InfoRow>
                  <InfoLabel>URL 식별자</InfoLabel>
                  <InfoValue><CodeText>{study.slug}</CodeText></InfoValue>
                </InfoRow>
              )}
            </InfoList>
          </InfoCard>

          {/* Right Column - Schedule Info */}
          <InfoCard>
            <CardTitle>일정 정보</CardTitle>
            <InfoList>
              {study.recruitDeadline && (
                <InfoRow>
                  <InfoLabel>모집 마감</InfoLabel>
                  <InfoValue><DateText>{formatDate(study.recruitDeadline, false)}</DateText></InfoValue>
                </InfoRow>
              )}
              {study.startDate && (
                <InfoRow>
                  <InfoLabel>시작일</InfoLabel>
                  <InfoValue><DateText>{formatDate(study.startDate, false)}</DateText></InfoValue>
                </InfoRow>
              )}
              {study.endDate && (
                <InfoRow>
                  <InfoLabel>종료일</InfoLabel>
                  <InfoValue><DateText>{formatDate(study.endDate, false)}</DateText></InfoValue>
                </InfoRow>
              )}
              <InfoRow>
                <InfoLabel>생성일</InfoLabel>
                <InfoValue><DateText>{formatDate(study.createdAt)}</DateText></InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>최종 수정</InfoLabel>
                <InfoValue><DateText>{formatDate(study.updatedAt)}</DateText></InfoValue>
              </InfoRow>
            </InfoList>
          </InfoCard>
        </ContentGrid>

        {/* Description */}
        {study.description && (
          <DescriptionCard>
            <CardTitle>스터디 설명</CardTitle>
            <Description>{study.description}</Description>
          </DescriptionCard>
        )}

        {/* Rejection Reason */}
        {study.status === StudyStatus.REJECTED && study.rejectionReason && (
          <RejectionCard>
            <CardTitle>거절 사유</CardTitle>
            <RejectionReason>{study.rejectionReason}</RejectionReason>
          </RejectionCard>
        )}

        {/* Action Buttons */}
        <ActionSection>
          <ActionGroup>
            {study.status === StudyStatus.PENDING && (
              <>
                <ActionButton $variant="success" onClick={() => onApprove?.(study.id)}>
                  승인
                </ActionButton>
                <ActionButton $variant="danger" onClick={() => onReject?.(study.id)}>
                  거절
                </ActionButton>
              </>
            )}
            {study.status === StudyStatus.APPROVED && (
              <ActionButton $variant="danger" onClick={() => onTerminate?.(study.id)}>
                종료
              </ActionButton>
            )}
            {study.status === StudyStatus.TERMINATED && (
              <ActionButton $variant="primary" onClick={() => onReactivate?.(study.id)}>
                재활성화
              </ActionButton>
            )}
          </ActionGroup>
          <ActionButton $variant="secondary" onClick={onClose}>
            닫기
          </ActionButton>
        </ActionSection>
      </DetailContainer>
    </Modal>
  );
};

const DetailContainer = styled.div`
  padding: 0;
  max-height: 80vh;
  overflow-y: auto;
`;

const HeaderCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}15 0%, ${({ theme }) => theme.colors.primary}05 100%);
  border: 1px solid ${({ theme }) => theme.colors.primary}20;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const StudyTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
  line-height: 1.2;
`;

const GenerationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.primary}40;
`;

const Tagline = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  margin: 0;
`;

const StatusSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: ${({ $color }) => $color};
  box-shadow: 0 2px 8px ${({ $color }) => $color}40;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary}20;
  color: ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary};
  border: 1px solid ${({ $type, theme }) => 
    $type === 'PARTICIPATORY' ? theme.colors.primary : theme.colors.secondary}30;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
`;

const QuickStats = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary}20;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  min-width: 80px;
  flex-shrink: 0;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: right;
  flex: 1;
`;

const CodeText = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
`;

const DateText = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 13px;
`;

const DescriptionCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: pre-wrap;
  margin: 0;
`;

const RejectionCard = styled.div`
  background: ${({ theme }) => theme.colors.error}08;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const RejectionReason = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.error};
  white-space: pre-wrap;
  margin: 0;
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
  margin-top: auto;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'success' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'primary': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'secondary': return theme.colors.gray[200];
      default: return theme.colors.primary;
    }
  }};
  
  color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'secondary': return theme.colors.text.primary;
      default: return 'white';
    }
  }};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme, $variant }) => {
      switch ($variant) {
        case 'primary': return theme.colors.primary;
        case 'success': return theme.colors.success;
        case 'danger': return theme.colors.danger;
        case 'secondary': return theme.colors.gray[300];
        default: return theme.colors.primary;
      }
    }}40;
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 480px) {
    flex: 1;
  }
`;

const LoadingText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

const ProposerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
`;

const ProposerName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProposerEmail = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProposerRole = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  background: ${({ theme }) => theme.colors.primary}15;
  padding: 2px 6px;
  border-radius: 4px;
`;

export default StudyDetailModal;