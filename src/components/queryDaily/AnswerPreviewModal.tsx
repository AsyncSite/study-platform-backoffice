import React, { useMemo } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { RefreshCw, X, User, Calendar, Tag, FileText, MessageSquare } from 'lucide-react';
import type { AnswerWithMember } from '../../services/queryDailyService';

interface AnswerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  answer: AnswerWithMember | null;
  onResend?: (answerId: string) => void;
}

interface AnswerContent {
  version?: string;
  question?: string;
  analysis?: string;
  keywords?: string[];
  starStructure?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
  personaAnswers?: {
    bigTech?: string;
    unicorn?: string;
  };
  followUpQuestions?: string[];
}

const AnswerPreviewModal: React.FC<AnswerPreviewModalProps> = ({
  isOpen,
  onClose,
  answer,
  onResend,
}) => {
  const parsedContent = useMemo<AnswerContent | null>(() => {
    if (!answer?.answerContent) return null;
    try {
      if (typeof answer.answerContent === 'string') {
        return JSON.parse(answer.answerContent);
      }
      return answer.answerContent as unknown as AnswerContent;
    } catch {
      return null;
    }
  }, [answer]);

  if (!answer) return null;

  const memberName = answer.member?.name || '회원';
  const memberEmail = answer.member?.email || '';
  const dayNumber = answer.currentDay || 1;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 이메일 미리보기 HTML 생성
  const generateEmailPreview = () => {
    const question = parsedContent?.question || answer.questionContent || '';
    const analysis = parsedContent?.analysis || '';
    const keywords = parsedContent?.keywords || [];
    const star = parsedContent?.starStructure;
    const personas = parsedContent?.personaAnswers;
    const followUps = parsedContent?.followUpQuestions || [];

    return `
      <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; color: white;">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Day ${dayNumber}</div>
            <div style="font-size: 18px; font-weight: 600;">오늘의 질문 답변 가이드</div>
          </div>

          <div style="padding: 24px;">
            <!-- Greeting -->
            <p style="color: #374151; font-size: 15px; margin: 0 0 24px 0;">안녕하세요 <strong>${memberName}</strong>님,</p>

            ${question ? `
            <!-- Question -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #6366f1; margin-bottom: 8px;">오늘의 질문</div>
              <div style="background: #f0f0ff; border-left: 3px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; font-style: italic; color: #374151; line-height: 1.6;">
                "${question}"
              </div>
            </div>
            ` : ''}

            ${analysis ? `
            <!-- Analysis -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">질문 분석</div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0;">${analysis}</p>
            </div>
            ` : ''}

            ${keywords.length > 0 ? `
            <!-- Keywords -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">핵심 키워드</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${keywords.map(k => `<span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 16px; font-size: 13px;">${k}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${star ? `
            <!-- STAR Structure -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">STAR 구조</div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${star.situation ? `
                <div style="display: flex; gap: 12px;">
                  <div style="width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">S</div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 2px;">상황 (Situation)</div>
                    <div style="font-size: 14px; color: #374151; line-height: 1.5;">${star.situation}</div>
                  </div>
                </div>
                ` : ''}
                ${star.task ? `
                <div style="display: flex; gap: 12px;">
                  <div style="width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">T</div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 2px;">과제 (Task)</div>
                    <div style="font-size: 14px; color: #374151; line-height: 1.5;">${star.task}</div>
                  </div>
                </div>
                ` : ''}
                ${star.action ? `
                <div style="display: flex; gap: 12px;">
                  <div style="width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">A</div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 2px;">행동 (Action)</div>
                    <div style="font-size: 14px; color: #374151; line-height: 1.5;">${star.action}</div>
                  </div>
                </div>
                ` : ''}
                ${star.result ? `
                <div style="display: flex; gap: 12px;">
                  <div style="width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">R</div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 2px;">결과 (Result)</div>
                    <div style="font-size: 14px; color: #374151; line-height: 1.5;">${star.result}</div>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            ${personas?.bigTech ? `
            <!-- Persona A -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Persona A: 빅테크 스타일</div>
              <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.7; color: #374151; white-space: pre-wrap;">${personas.bigTech}</div>
            </div>
            ` : ''}

            ${personas?.unicorn ? `
            <!-- Persona B -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Persona B: 스타트업 스타일</div>
              <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.7; color: #374151; white-space: pre-wrap;">${personas.unicorn}</div>
            </div>
            ` : ''}

            ${followUps.length > 0 ? `
            <!-- Follow-up Questions -->
            <div style="margin-bottom: 16px;">
              <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">예상 꼬리 질문</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${followUps.map((q, i) => `
                <div style="display: flex; gap: 12px; background: #f9fafb; padding: 12px 14px; border-radius: 8px;">
                  <div style="width: 22px; height: 22px; background: #f59e0b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0;">${i + 1}</div>
                  <div style="font-size: 14px; color: #374151; line-height: 1.5;">${q}</div>
                </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">이 메시지는 QueryDaily에서 발송되었습니다.</p>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="답변 가이드 상세" size="large">
      <ModalContent>
        <DetailGrid>
          {/* Left: 상세 정보 */}
          <DetailSection>
            <SectionTitle>답변 상세</SectionTitle>
            <DetailFields>
              <DetailField>
                <DetailLabel>
                  <User size={14} />
                  받는 사람
                </DetailLabel>
                <DetailValue>{memberName} ({memberEmail})</DetailValue>
              </DetailField>

              <DetailRow>
                <DetailField>
                  <DetailLabel>
                    <Calendar size={14} />
                    발송일
                  </DetailLabel>
                  <DetailValue>{formatDateTime(answer.scheduledAt)}</DetailValue>
                </DetailField>
                <DetailField>
                  <DetailLabel>
                    <FileText size={14} />
                    Day
                  </DetailLabel>
                  <DetailValue>Day {dayNumber} / {answer.totalDays || 20}</DetailValue>
                </DetailField>
              </DetailRow>

              {parsedContent?.question && (
                <DetailField>
                  <DetailLabel>
                    <MessageSquare size={14} />
                    질문 내용
                  </DetailLabel>
                  <QuestionTextarea value={parsedContent.question} readOnly />
                </DetailField>
              )}

              {parsedContent?.keywords && parsedContent.keywords.length > 0 && (
                <DetailField>
                  <DetailLabel>
                    <Tag size={14} />
                    핵심 키워드
                  </DetailLabel>
                  <KeywordTags>
                    {parsedContent.keywords.map((keyword, idx) => (
                      <KeywordTag key={idx}>{keyword}</KeywordTag>
                    ))}
                  </KeywordTags>
                </DetailField>
              )}

              {parsedContent?.analysis && (
                <DetailField>
                  <DetailLabel>질문 분석</DetailLabel>
                  <AnalysisBox>{parsedContent.analysis}</AnalysisBox>
                </DetailField>
              )}
            </DetailFields>

            {/* Actions */}
            <ActionSection>
              <CloseButton onClick={onClose}>
                <X size={16} />
                닫기
              </CloseButton>
              {onResend && (
                <ResendButton onClick={() => onResend(answer.id)}>
                  <RefreshCw size={16} />
                  재발송
                </ResendButton>
              )}
            </ActionSection>
          </DetailSection>

          {/* Right: 이메일 미리보기 */}
          <PreviewSection>
            <SectionTitle>이메일 미리보기</SectionTitle>
            <PreviewContainer>
              <PreviewContent
                dangerouslySetInnerHTML={{ __html: generateEmailPreview() }}
              />
            </PreviewContainer>
          </PreviewSection>
        </DetailGrid>
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  padding: 24px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media (max-width: ${({ theme }) => theme.breakpoints?.tablet || '768px'}) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;
`;

const DetailFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
`;

const DetailField = styled.div``;

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 6px;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const QuestionTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.text.primary};
  resize: none;
  min-height: 80px;
`;

const KeywordTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const KeywordTag = styled.span`
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const AnalysisBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-height: 120px;
  overflow-y: auto;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: 20px;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
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

const ResendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
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
  }
`;

const PreviewContainer = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  max-height: 600px;
  overflow-y: auto;
`;

const PreviewContent = styled.div`
  background: #f8f9fa;
`;

export default AnswerPreviewModal;
