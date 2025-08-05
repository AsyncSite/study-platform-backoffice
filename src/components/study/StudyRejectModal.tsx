import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import Button, { ButtonVariant, ButtonSize } from '../common/Button';

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
      title="스터디 거절"
      size="medium"
    >
      <ModalContent>
        <StudyInfo>
          <Label>스터디 제목</Label>
          <StudyTitle>{studyTitle}</StudyTitle>
        </StudyInfo>

        <ReasonSection>
          <Label>거절 사유 <Required>*</Required></Label>
          <ReasonTextarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="거절 사유를 입력해주세요. 제안자에게 전달됩니다."
            rows={4}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ReasonSection>

        <ButtonGroup>
          <Button
            variant={ButtonVariant.SECONDARY}
            size={ButtonSize.MEDIUM}
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            variant={ButtonVariant.ERROR}
            size={ButtonSize.MEDIUM}
            onClick={handleSubmit}
          >
            거절
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StudyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StudyTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ReasonSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;

const ReasonTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ErrorMessage = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.error};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

export default StudyRejectModal;