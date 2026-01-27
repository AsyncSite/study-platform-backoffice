import styled from 'styled-components';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  savedAt: string;
  previewText: string;
}

const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  isOpen,
  onRecover,
  onDiscard,
  savedAt,
  previewText,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <IconWrapper>
          <Icon>📝</Icon>
        </IconWrapper>

        <Title>이전 작성 내용이 있습니다</Title>

        <Description>
          저장된 시간: <strong>{savedAt}</strong>
        </Description>

        <PreviewBox>
          <PreviewLabel>미리보기</PreviewLabel>
          <PreviewContent>{previewText}</PreviewContent>
        </PreviewBox>

        <ButtonGroup>
          <RecoverButton onClick={onRecover}>
            복구하기
          </RecoverButton>
          <DiscardButton onClick={onDiscard}>
            무시하고 새로 작성
          </DiscardButton>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default DraftRecoveryModal;

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
`;

const Icon = styled.span`
  font-size: 32px;
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`;

const Description = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #6b7280;

  strong {
    color: #374151;
  }
`;

const PreviewBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 24px;
  text-align: left;
`;

const PreviewLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const PreviewContent = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RecoverButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #15803d;
  }
`;

const DiscardButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;
