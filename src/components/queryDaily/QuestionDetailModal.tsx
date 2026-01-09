import React from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { MessageSquare, Tag, Calendar, User, FileText, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import type { QuestionWithMember } from '../../services/queryDailyService';

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionWithMember | null;
  onViewAnswer?: () => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  isOpen,
  onClose,
  question,
  onViewAnswer,
}) => {
  if (!question) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 실제 발송 여부는 Delivery 테이블 기준 (API에서 sent 필드로 제공)
  const status: 'sent' | 'scheduled' = question.sent ? 'sent' : 'scheduled';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="질문 상세" size="large">
      <ModalContent>
        {/* Header Card */}
        <HeaderCard>
          <HeaderIcon>
            <MessageSquare size={28} />
          </HeaderIcon>
          <HeaderInfo>
            <DayBadge>Day {question.currentDay || 1} / {question.totalDays || 20}</DayBadge>
            <TypeBadge $type={question.type}>
              {question.type === 'TRIAL' ? '무료체험' :
               question.type === 'GROWTH_PLAN' ? '성장 플랜' : question.type}
            </TypeBadge>
            <StatusBadge $status={status}>
              {status === 'sent' ? (
                <>
                  <CheckCircle size={14} />
                  발송 완료
                </>
              ) : (
                <>
                  <Clock size={14} />
                  예약됨
                </>
              )}
            </StatusBadge>
          </HeaderInfo>
        </HeaderCard>

        {/* Question Content */}
        <Section>
          <SectionTitle>
            <MessageSquare size={16} />
            질문 내용
          </SectionTitle>
          <QuestionContent>{question.content}</QuestionContent>
        </Section>

        {/* Metadata Grid */}
        <MetadataGrid>
          <MetadataItem>
            <MetadataLabel>
              <User size={14} />
              받는 사람
            </MetadataLabel>
            <MetadataValue>
              {question.member.name} ({question.member.email})
            </MetadataValue>
          </MetadataItem>

          <MetadataItem>
            <MetadataLabel>
              <Calendar size={14} />
              발송 예정
            </MetadataLabel>
            <MetadataValue>{formatDateTime(question.scheduledAt)}</MetadataValue>
          </MetadataItem>

          <MetadataItem>
            <MetadataLabel>
              <Tag size={14} />
              질문 ID
            </MetadataLabel>
            <MetadataValue>
              <code>{question.id}</code>
            </MetadataValue>
          </MetadataItem>

          <MetadataItem>
            <MetadataLabel>
              <FileText size={14} />
              답변 가이드
            </MetadataLabel>
            <MetadataValue>
              {question.hasAnswer ? (
                <AnswerBadge $hasAnswer>생성됨</AnswerBadge>
              ) : (
                <AnswerBadge $hasAnswer={false}>없음</AnswerBadge>
              )}
            </MetadataValue>
          </MetadataItem>
        </MetadataGrid>

        {/* Actions */}
        <ActionSection>
          <CloseButton onClick={onClose}>닫기</CloseButton>
          {question.hasAnswer && onViewAnswer && (
            <ViewAnswerButton onClick={onViewAnswer}>
              답변 보기
              <ChevronRight size={16} />
            </ViewAnswerButton>
          )}
        </ActionSection>
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeaderCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}08 0%, ${({ theme }) => theme.colors.primary}03 100%);
  border: 1px solid ${({ theme }) => theme.colors.primary}20;
  border-radius: 16px;
  padding: 20px;
`;

const HeaderIcon = styled.div`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 14px;
  flex-shrink: 0;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const DayBadge = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
`;

const TypeBadge = styled.span<{ $type: string }>`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
`;

const StatusBadge = styled.span<{ $status: 'sent' | 'scheduled' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;

  ${({ $status, theme }) => $status === 'sent' ? `
    background: ${theme.colors.success}15;
    color: ${theme.colors.success};
  ` : `
    background: ${theme.colors.warning}15;
    color: ${theme.colors.warning};
  `}
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 16px 0;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const QuestionContent = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: pre-wrap;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const MetadataItem = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 14px;
`;

const MetadataLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: 8px;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MetadataValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};

  code {
    font-family: 'SF Mono', monospace;
    font-size: 12px;
    background: ${({ theme }) => theme.colors.gray[100]};
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

const AnswerBadge = styled.span<{ $hasAnswer: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  ${({ $hasAnswer, theme }) => $hasAnswer ? `
    background: ${theme.colors.success}15;
    color: ${theme.colors.success};
  ` : `
    background: ${theme.colors.gray[200]};
    color: ${theme.colors.text.tertiary};
  `}
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const CloseButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ViewAnswerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateX(2px);
  }
`;

export default QuestionDetailModal;
