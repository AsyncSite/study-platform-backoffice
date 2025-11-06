import React from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { Mail, Building2, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { CompanyEmailVerification } from '../../types/queryDailyMobile';

interface CompanyEmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: CompanyEmailVerification | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const CompanyEmailDetailModal: React.FC<CompanyEmailDetailModalProps> = ({
  isOpen,
  onClose,
  verification,
  onApprove,
  onReject,
}) => {
  if (!verification) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="회사 이메일 인증 상세" size="large">
      <ModalContent>
        {/* Header Card */}
        <HeaderCard>
          <CompanySection>
            <CompanyIcon>
              <Building2 size={32} />
            </CompanyIcon>
            <CompanyInfo>
              <CompanyName>{verification.companyName}</CompanyName>
              <CompanyEmail>{verification.companyEmail}</CompanyEmail>
            </CompanyInfo>
          </CompanySection>
        </HeaderCard>

        {/* Details Grid */}
        <DetailsGrid>
          {/* User ID */}
          <DetailItem>
            <DetailLabel>
              <User size={16} />
              사용자 ID
            </DetailLabel>
            <DetailValue>{verification.userId}</DetailValue>
          </DetailItem>

          {/* Verification ID */}
          <DetailItem>
            <DetailLabel>
              <Mail size={16} />
              인증 ID
            </DetailLabel>
            <DetailValue>{verification.verificationId}</DetailValue>
          </DetailItem>

          {/* Created At */}
          <DetailItem>
            <DetailLabel>
              <Calendar size={16} />
              인증 요청 시각
            </DetailLabel>
            <DetailValue>{formatDateTime(verification.createdAt)}</DetailValue>
          </DetailItem>

          {/* Verified At */}
          <DetailItem>
            <DetailLabel>
              <Clock size={16} />
              코드 인증 완료 시각
            </DetailLabel>
            <DetailValue>{formatDateTime(verification.verifiedAt)}</DetailValue>
          </DetailItem>
        </DetailsGrid>

        {/* Status Info */}
        <StatusSection>
          <StatusLabel>인증 상태</StatusLabel>
          <StatusBadge $status="pending">
            <Clock size={16} />
            승인 대기 중
          </StatusBadge>
        </StatusSection>

        {/* Actions */}
        {(onApprove || onReject) && (
          <ActionSection>
            <ActionLabel>관리자 액션</ActionLabel>
            <ActionButtons>
              {onReject && (
                <ActionButton
                  $variant="danger"
                  onClick={() => {
                    onReject(verification.verificationId);
                    onClose();
                  }}
                >
                  <XCircle size={18} />
                  거절
                </ActionButton>
              )}
              {onApprove && (
                <ActionButton
                  $variant="success"
                  onClick={() => {
                    onApprove(verification.verificationId);
                    onClose();
                  }}
                >
                  <CheckCircle size={18} />
                  승인
                </ActionButton>
              )}
            </ActionButtons>
          </ActionSection>
        )}
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeaderCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}08 0%, ${({ theme }) => theme.colors.primary}03 100%);
  border: 1px solid ${({ theme }) => theme.colors.primary}20;
  border-radius: 16px;
  padding: 24px;
`;

const CompanySection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const CompanyIcon = styled.div`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  flex-shrink: 0;
`;

const CompanyInfo = styled.div`
  flex: 1;
`;

const CompanyName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const CompanyEmail = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const DetailItem = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
`;

const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-all;
`;

const StatusSection = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const StatusLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 12px;
`;

const StatusBadge = styled.div<{ $status: 'pending' | 'approved' | 'rejected' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;

  ${({ $status, theme }) => {
    switch ($status) {
      case 'pending':
        return `
          background: ${theme.colors.warning}15;
          color: ${theme.colors.warning};
        `;
      case 'approved':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
        `;
      case 'rejected':
        return `
          background: ${theme.colors.danger}15;
          color: ${theme.colors.danger};
        `;
    }
  }}
`;

const ActionSection = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
  padding: 20px;
  margin-top: 8px;
`;

const ActionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ActionButton = styled.button<{ $variant: 'success' | 'danger' }>`
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

  background: ${({ theme, $variant }) =>
    $variant === 'success' ? theme.colors.success : theme.colors.danger};
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme, $variant }) =>
      $variant === 'success' ? theme.colors.success : theme.colors.danger}40;
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

export default CompanyEmailDetailModal;
