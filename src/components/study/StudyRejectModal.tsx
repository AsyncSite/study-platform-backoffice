import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { AlertTriangle, XCircle, FileText } from 'lucide-react';

interface StudyRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  studyTitle: string;
}

const StudyRejectModal: React.FC<StudyRejectModalProps> = ({
  isOpen,
  onClose,
  onReject,
  studyTitle,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('거절 사유를 입력해주세요.');
      return;
    }

    onReject(reason.trim());
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="medium"
    >
      <ModalContent>
        {/* Header */}
        <HeaderSection>
          <IconWrapper>
            <AlertTriangle size={24} />
          </IconWrapper>
          <HeaderText>
            <HeaderTitle>스터디 거절</HeaderTitle>
            <HeaderDescription>
              이 스터디를 거절하시겠습니까? 거절 사유는 제안자에게 전달됩니다.
            </HeaderDescription>
          </HeaderText>
        </HeaderSection>

        {/* Study Info */}
        <StudyInfoCard>
          <StudyInfoHeader>
            <FileText size={16} />
            <span>거절할 스터디</span>
          </StudyInfoHeader>
          <StudyTitle>{studyTitle}</StudyTitle>
        </StudyInfoCard>

        {/* Reason Section */}
        <ReasonSection>
          <ReasonLabel>
            거절 사유 <Required>*</Required>
          </ReasonLabel>
          <ReasonTextarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="거절 사유를 상세히 입력해주세요.&#10;&#10;예시:&#10;- 주제가 명확하지 않습니다&#10;- 일정이 현실적이지 않습니다&#10;- 추가 정보가 필요합니다"
            rows={6}
            $hasError={!!error}
          />
          {error && (
            <ErrorMessage>
              <XCircle size={16} />
              {error}
            </ErrorMessage>
          )}
        </ReasonSection>

        {/* Action Buttons */}
        <ActionSection>
          <ActionButton $variant="secondary" onClick={handleClose}>
            취소
          </ActionButton>
          <ActionButton $variant="danger" onClick={handleSubmit}>
            <XCircle size={18} />
            거절하기
          </ActionButton>
        </ActionSection>
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.warning}08 0%, ${({ theme }) => theme.colors.warning}03 100%);
  border: 1px solid ${({ theme }) => theme.colors.warning}20;
  border-radius: 16px;
  margin-bottom: 8px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.warning}15;
  color: ${({ theme }) => theme.colors.warning};
  border-radius: 12px;
  flex-shrink: 0;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const HeaderDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  margin: 0;
`;

const StudyInfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const StudyInfoHeader = styled.div`
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

const StudyTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
`;

const ReasonSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReasonLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  margin-left: 4px;
`;

const ReasonTextarea = styled.textarea<{ $hasError: boolean }>`
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme, $hasError }) => 
    $hasError ? theme.colors.danger : theme.colors.border};
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) => 
      $hasError ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme, $hasError }) => 
      $hasError ? theme.colors.danger + '15' : theme.colors.primary + '15'};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.disabled};
    line-height: 1.6;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.danger}08;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.danger}20;
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
  margin-top: 8px;
`;

const ActionButton = styled.button<{ $variant: 'secondary' | 'danger' }>`
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
      case 'danger': return theme.colors.danger;
      case 'secondary': return theme.colors.background;
      default: return theme.colors.primary;
    }
  }};
  
  color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'secondary': return theme.colors.text.primary;
      default: return 'white';
    }
  }};
  
  border: ${({ theme, $variant }) => 
    $variant === 'secondary' ? `1px solid ${theme.colors.border}` : 'none'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme, $variant }) => {
      switch ($variant) {
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
`;

export default StudyRejectModal;