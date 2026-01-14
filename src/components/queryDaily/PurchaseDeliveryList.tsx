import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MessageSquare, Mail, Clock, CheckCircle, Tag } from 'lucide-react';
import queryDailyService, { type QuestionWithMember, type AnswerWithMember } from '../../services/queryDailyService';

interface PurchaseDeliveryListProps {
  purchaseId: string;
  memberId: string;
  maxDeliveries: number;
  questionSentCount: number;
  answerSentCount: number;
  isExpanded: boolean;
  onQuestionClick: (question: QuestionWithMember) => void;
  onAnswerClick: (answer: AnswerWithMember) => void;
  mode?: 'default' | 'answerOnly';  // 크리티컬히트는 answerOnly
}

interface DeliveryItem {
  dayNumber: number;
  question: QuestionWithMember | null;
  answer: AnswerWithMember | null;
  keywords: string[];
}

interface AnswerContent {
  keywords?: string[];
  question?: string;
}

const PurchaseDeliveryList: React.FC<PurchaseDeliveryListProps> = ({
  purchaseId,
  memberId,
  maxDeliveries,
  questionSentCount,
  answerSentCount,
  isExpanded,
  onQuestionClick,
  onAnswerClick,
  mode = 'default',
}) => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && memberId) {
      loadDeliveries();
    }
  }, [isExpanded, memberId, purchaseId]);

  const parseAnswerContent = (answerContent: string): AnswerContent => {
    try {
      return JSON.parse(answerContent);
    } catch {
      return {};
    }
  };

  const loadDeliveries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'answerOnly') {
        // 크리티컬 히트: 답변만 조회
        const answersRes = await queryDailyService.getAnswers({ memberId, size: 100 });
        const answers = answersRes.content || [];

        const deliveryMap = new Map<number, DeliveryItem>();
        answers.forEach((a) => {
          const day = a.currentDay || 1;
          if (!deliveryMap.has(day)) {
            deliveryMap.set(day, { dayNumber: day, question: null, answer: null, keywords: [] });
          }
          const item = deliveryMap.get(day)!;
          item.answer = a;
          const parsed = parseAnswerContent(a.answerContent);
          item.keywords = parsed.keywords || [];
        });

        const sortedDeliveries = Array.from(deliveryMap.values())
          .sort((a, b) => a.dayNumber - b.dayNumber);
        setDeliveries(sortedDeliveries);
      } else {
        // 기본 모드: 질문과 답변 모두 조회
        const [questionsRes, answersRes] = await Promise.all([
          queryDailyService.getQuestions({ memberId, size: 100 }),
          queryDailyService.getAnswers({ memberId, size: 100 }),
        ]);

        const questions = questionsRes.content || [];
        const answers = answersRes.content || [];

        const deliveryMap = new Map<number, DeliveryItem>();

        questions.forEach((q) => {
          const day = q.currentDay || 1;
          if (!deliveryMap.has(day)) {
            deliveryMap.set(day, { dayNumber: day, question: null, answer: null, keywords: [] });
          }
          deliveryMap.get(day)!.question = q;
        });

        answers.forEach((a) => {
          const day = a.currentDay || 1;
          if (!deliveryMap.has(day)) {
            deliveryMap.set(day, { dayNumber: day, question: null, answer: null, keywords: [] });
          }
          const item = deliveryMap.get(day)!;
          item.answer = a;
          const parsed = parseAnswerContent(a.answerContent);
          item.keywords = parsed.keywords || [];
        });

        const sortedDeliveries = Array.from(deliveryMap.values())
          .sort((a, b) => a.dayNumber - b.dayNumber);
        setDeliveries(sortedDeliveries);
      }
    } catch (err: any) {
      console.error('Failed to load deliveries:', err);
      setError('발송 이력을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionStatus = (question: QuestionWithMember): 'sent' | 'scheduled' => {
    // 실제 발송 여부는 Delivery 테이블 기준 (API에서 sent 필드로 제공)
    return question.sent ? 'sent' : 'scheduled';
  };

  // Answer는 아직 sent 필드가 없으므로 scheduledAt 기준으로 체크 (TODO: Answer도 sent 필드 추가)
  const getAnswerStatus = (scheduledAt: string): 'sent' | 'scheduled' => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    return scheduled <= now ? 'sent' : 'scheduled';
  };

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <Container>
        <LoadingText>불러오는 중...</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorText>{error}</ErrorText>
      </Container>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Container>
        <EmptyText>
          {mode === 'answerOnly' ? '아직 발송된 답변이 없습니다.' : '아직 발송된 질문이 없습니다.'}
        </EmptyText>
      </Container>
    );
  }

  // 크리티컬 히트 모드 (답변만)
  if (mode === 'answerOnly') {
    return (
      <Container>
        <Header>
          <Title>발송된 답변 목록</Title>
          <Summary>답변 {answerSentCount}/{maxDeliveries}</Summary>
        </Header>

        <QuestionList>
          {deliveries.map((delivery) => (
            <QuestionCard key={delivery.dayNumber}>
              {delivery.answer ? (
                <>
                  <CardHeader>
                    <RoundBadge>{delivery.dayNumber}회차</RoundBadge>
                    <StatusBadge $status={getAnswerStatus(delivery.answer.scheduledAt)}>
                      {getAnswerStatus(delivery.answer.scheduledAt) === 'sent' ? (
                        <>
                          <CheckCircle size={12} />
                          발송완료
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          예약됨
                        </>
                      )}
                    </StatusBadge>
                    <DateText>{formatDateTime(delivery.answer.scheduledAt)}</DateText>
                  </CardHeader>

                  {/* 핵심 키워드 표시 */}
                  {delivery.keywords.length > 0 && (
                    <KeywordSection>
                      <KeywordIcon>
                        <Tag size={14} />
                      </KeywordIcon>
                      <KeywordList>
                        {delivery.keywords.slice(0, 4).map((keyword, idx) => (
                          <Keyword key={idx}>{keyword}</Keyword>
                        ))}
                        {delivery.keywords.length > 4 && (
                          <MoreKeywords>+{delivery.keywords.length - 4}</MoreKeywords>
                        )}
                      </KeywordList>
                    </KeywordSection>
                  )}

                  <ActionRow>
                    <ActionButton $primary onClick={() => onAnswerClick(delivery.answer!)}>
                      <Mail size={14} />
                      답변 미리보기
                    </ActionButton>
                  </ActionRow>
                </>
              ) : (
                <EmptyCard>
                  <RoundBadge>{delivery.dayNumber}회차</RoundBadge>
                  <EmptyCardText>답변 없음</EmptyCardText>
                </EmptyCard>
              )}
            </QuestionCard>
          ))}

          {deliveries.length < maxDeliveries && (
            <RemainingDays>
              {deliveries.length + 1}회차 ~ {maxDeliveries}회차: 아직 발송되지 않음
            </RemainingDays>
          )}
        </QuestionList>
      </Container>
    );
  }

  // 기본 모드 (질문 + 답변)
  return (
    <Container>
      <Header>
        <Title>발송된 질문 목록</Title>
        <Summary>
          질문 {questionSentCount}/{maxDeliveries} · 답변 {answerSentCount}/{maxDeliveries}
        </Summary>
      </Header>

      <QuestionList>
        {deliveries.map((delivery) => (
          <QuestionCard key={delivery.dayNumber}>
            {delivery.question ? (
              <>
                <CardHeader>
                  <DayBadge>Day {delivery.dayNumber}</DayBadge>
                  <StatusBadge $status={getQuestionStatus(delivery.question)}>
                    {getQuestionStatus(delivery.question) === 'sent' ? (
                      <>
                        <CheckCircle size={12} />
                        발송완료
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        예약됨
                      </>
                    )}
                  </StatusBadge>
                  <DateText>
                    {delivery.question.sent && delivery.question.sentAt
                      ? formatDateTime(delivery.question.sentAt)
                      : formatDateTime(delivery.question.scheduledAt)}
                  </DateText>
                </CardHeader>

                {/* 핵심 키워드 표시 */}
                {delivery.keywords.length > 0 && (
                  <KeywordSection>
                    <KeywordIcon>
                      <Tag size={14} />
                    </KeywordIcon>
                    <KeywordList>
                      {delivery.keywords.slice(0, 4).map((keyword, idx) => (
                        <Keyword key={idx}>{keyword}</Keyword>
                      ))}
                      {delivery.keywords.length > 4 && (
                        <MoreKeywords>+{delivery.keywords.length - 4}</MoreKeywords>
                      )}
                    </KeywordList>
                  </KeywordSection>
                )}

                <ActionRow>
                  <ActionButton onClick={() => onQuestionClick(delivery.question!)}>
                    <MessageSquare size={14} />
                    질문 보기
                  </ActionButton>
                  {delivery.answer && (
                    <ActionButton $primary onClick={() => onAnswerClick(delivery.answer!)}>
                      <Mail size={14} />
                      답변 미리보기
                    </ActionButton>
                  )}
                </ActionRow>
              </>
            ) : (
              <EmptyCard>
                <DayBadge>Day {delivery.dayNumber}</DayBadge>
                <EmptyCardText>질문 없음</EmptyCardText>
              </EmptyCard>
            )}
          </QuestionCard>
        ))}

        {deliveries.length < maxDeliveries && (
          <RemainingDays>
            Day {deliveries.length + 1} ~ {maxDeliveries}: 아직 생성되지 않음
          </RemainingDays>
        )}
      </QuestionList>
    </Container>
  );
};

const Container = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Summary = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingText = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 20px;
`;

const ErrorText = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.danger};
  padding: 20px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 20px;
`;

const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestionCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const DayBadge = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
`;

const RoundBadge = styled.span`
  background: #f97316;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
`;

const StatusBadge = styled.span<{ $status: 'sent' | 'scheduled' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  ${({ $status, theme }) => $status === 'sent' ? `
    background: ${theme.colors.success}15;
    color: ${theme.colors.success};
  ` : `
    background: ${theme.colors.warning}15;
    color: ${theme.colors.warning};
  `}
`;

const DateText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-left: auto;
`;

const KeywordSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
`;

const KeywordIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 2px;
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
`;

const Keyword = styled.span`
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const MoreKeywords = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 12px;
  padding: 4px 6px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $primary, theme }) => $primary ? `
    background: ${theme.colors.primary};
    color: white;
    border: none;

    &:hover {
      opacity: 0.9;
    }
  ` : `
    background: white;
    color: ${theme.colors.text.secondary};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.gray[50]};
      color: ${theme.colors.text.primary};
    }
  `}
`;

const EmptyCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const EmptyCardText = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 13px;
`;

const RemainingDays = styled.div`
  text-align: center;
  padding: 16px;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 13px;
  background: white;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
`;

export default PurchaseDeliveryList;
