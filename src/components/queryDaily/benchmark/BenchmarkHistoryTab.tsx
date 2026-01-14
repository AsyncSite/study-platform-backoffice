import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { benchmarkApi } from '../../../api/benchmark';
import type { BenchmarkHistoryItem, BenchmarkJobSummary, ModelComparisonStats, PageResponse, AnswerGuide } from '../../../types/benchmark';

const BenchmarkHistoryTab: React.FC = () => {
  const [history, setHistory] = useState<PageResponse<BenchmarkJobSummary> | null>(null);
  const [comparison, setComparison] = useState<ModelComparisonStats[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<BenchmarkHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadHistory();
    loadComparison();
  }, [page]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await benchmarkApi.getHistory(page, 10);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await benchmarkApi.getModelComparison(30);
      setComparison(data);
    } catch (err) {
      console.error('Failed to load comparison:', err);
    }
  };

  const loadJobDetails = async (jobId: string) => {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      setJobDetails([]);
      return;
    }
    try {
      const data = await benchmarkApi.getHistoryByJobId(jobId);
      setJobDetails(data);
      setSelectedJobId(jobId);
    } catch (err) {
      console.error('Failed to load job details:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return '#9ca3af';
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const formatTokenCount = (count: number | null | undefined): string => {
    if (count === null || count === undefined) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const parseAnswerGuide = (json: string | null): AnswerGuide | null => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  return (
    <Container>
      <ComparisonSection>
        <SectionTitle>모델별 성능 비교 (최근 30일)</SectionTitle>
        {comparison.length > 0 ? (
          <ComparisonGrid>
            {comparison.map((stat, idx) => (
              <ComparisonCard key={idx}>
                <ModelName>
                  <ProviderBadge provider={stat.modelProvider}>{stat.modelProvider}</ProviderBadge>
                  {stat.modelName}
                </ModelName>
                <StatGrid>
                  <StatItem>
                    <StatLabel>평균 점수</StatLabel>
                    <StatValue color={getScoreColor(stat.avgTotalScore)}>
                      {stat.avgTotalScore?.toFixed(1) || '-'}
                    </StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>평균 지연</StatLabel>
                    <StatValue>{(stat.avgLatencyMs / 1000).toFixed(1)}s</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>총 질문</StatLabel>
                    <StatValue>{stat.totalQuestions}개</StatValue>
                  </StatItem>
                </StatGrid>
                <TokenStats>
                  <TokenItem>
                    <TokenLabel>Input</TokenLabel>
                    <TokenValue>{formatTokenCount(stat.totalInputTokens)}</TokenValue>
                  </TokenItem>
                  <TokenItem>
                    <TokenLabel>Output</TokenLabel>
                    <TokenValue>{formatTokenCount(stat.totalOutputTokens)}</TokenValue>
                  </TokenItem>
                  <TokenItem>
                    <TokenLabel>비용</TokenLabel>
                    <TokenValue>${stat.totalCostUsd?.toFixed(4) || '0'}</TokenValue>
                  </TokenItem>
                </TokenStats>
              </ComparisonCard>
            ))}
          </ComparisonGrid>
        ) : (
          <EmptyState>아직 벤치마크 데이터가 없습니다.</EmptyState>
        )}
      </ComparisonSection>

      <HistorySection>
        <SectionTitle>벤치마크 히스토리</SectionTitle>
        {isLoading ? (
          <LoadingText>로딩 중...</LoadingText>
        ) : history && history.content.length > 0 ? (
          <>
            <HistoryList>
              {history.content.map((job) => (
                <HistoryItem key={job.jobId}>
                  <HistoryHeader onClick={() => loadJobDetails(job.jobId)}>
                    <HistoryInfo>
                      <JobId>{job.jobId.slice(0, 8)}...</JobId>
                      <HistoryMeta>
                        <MetaItem>{formatDate(job.createdAt)}</MetaItem>
                        <MetaItem>{job.modelNames?.join(', ') || '-'}</MetaItem>
                        <MetaItem>{job.totalQuestions}개 질문</MetaItem>
                        <MetaItem>{formatTokenCount((job.totalInputTokens || 0) + (job.totalOutputTokens || 0))} 토큰</MetaItem>
                        <MetaItem>${job.totalCostUsd?.toFixed(4)}</MetaItem>
                      </HistoryMeta>
                    </HistoryInfo>
                    <HistoryScore color={getScoreColor(job.avgTotalScore)}>
                      {job.avgTotalScore?.toFixed(1) || '-'}
                    </HistoryScore>
                    <ExpandIcon>{selectedJobId === job.jobId ? '▼' : '▶'}</ExpandIcon>
                  </HistoryHeader>

                  {selectedJobId === job.jobId && jobDetails.length > 0 && (
                    <JobDetailsContainer>
                      {jobDetails.map((detail, idx) => {
                        const answerGuide = parseAnswerGuide(detail.answerGuideJson);
                        return (
                          <QuestionCard key={idx}>
                            <QuestionCardHeader>
                              <QuestionMeta>
                                <QuestionNumber>Q{detail.questionNumber}</QuestionNumber>
                                <QuestionType>{detail.questionType}</QuestionType>
                                <QuestionTopic>{detail.questionTopic}</QuestionTopic>
                                <ProviderBadge provider={detail.modelProvider}>{detail.modelProvider}</ProviderBadge>
                                <ModelBadge>{detail.modelName}</ModelBadge>
                              </QuestionMeta>
                              <QuestionScore color={getScoreColor(detail.evalTotalScore)}>
                                {detail.evalTotalScore?.toFixed(1) || '-'}점
                              </QuestionScore>
                            </QuestionCardHeader>

                            <QuestionSection>
                              <SectionLabel>💬 질문</SectionLabel>
                              <QuestionText>{detail.questionContent}</QuestionText>
                            </QuestionSection>

                            {detail.resumeReference && (
                              <ResumeSection>
                                <SectionLabel>📄 이력서 참조</SectionLabel>
                                <ResumeText>{detail.resumeReference}</ResumeText>
                              </ResumeSection>
                            )}

                            {answerGuide && (
                              <AnswerSection>
                                <SectionLabel>✅ 답변 가이드</SectionLabel>

                                {answerGuide.analysis && (
                                  <AnswerBlock>
                                    <BlockTitle>분석</BlockTitle>
                                    <BlockContent>{answerGuide.analysis}</BlockContent>
                                  </AnswerBlock>
                                )}

                                {answerGuide.keywords && answerGuide.keywords.length > 0 && (
                                  <AnswerBlock>
                                    <BlockTitle>핵심 키워드</BlockTitle>
                                    <KeywordList>
                                      {answerGuide.keywords.map((kw, i) => (
                                        <Keyword key={i}>{kw}</Keyword>
                                      ))}
                                    </KeywordList>
                                  </AnswerBlock>
                                )}

                                {answerGuide.starStructure && (
                                  <AnswerBlock>
                                    <BlockTitle>STAR 구조</BlockTitle>
                                    <StarGrid>
                                      <StarItem>
                                        <StarLabel>S (상황)</StarLabel>
                                        <StarContent>{answerGuide.starStructure.situation}</StarContent>
                                      </StarItem>
                                      <StarItem>
                                        <StarLabel>T (과제)</StarLabel>
                                        <StarContent>{answerGuide.starStructure.task}</StarContent>
                                      </StarItem>
                                      <StarItem>
                                        <StarLabel>A (행동)</StarLabel>
                                        <StarContent>{answerGuide.starStructure.action}</StarContent>
                                      </StarItem>
                                      <StarItem>
                                        <StarLabel>R (결과)</StarLabel>
                                        <StarContent>{answerGuide.starStructure.result}</StarContent>
                                      </StarItem>
                                    </StarGrid>
                                  </AnswerBlock>
                                )}

                                {answerGuide.personaAnswers && (
                                  <AnswerBlock>
                                    <BlockTitle>페르소나 답변 예시</BlockTitle>
                                    <PersonaGrid>
                                      {answerGuide.personaAnswers.bigTech && (
                                        <PersonaItem>
                                          <PersonaLabel>🏢 빅테크</PersonaLabel>
                                          <PersonaContent>{answerGuide.personaAnswers.bigTech}</PersonaContent>
                                        </PersonaItem>
                                      )}
                                      {answerGuide.personaAnswers.unicorn && (
                                        <PersonaItem>
                                          <PersonaLabel>🦄 유니콘</PersonaLabel>
                                          <PersonaContent>{answerGuide.personaAnswers.unicorn}</PersonaContent>
                                        </PersonaItem>
                                      )}
                                    </PersonaGrid>
                                  </AnswerBlock>
                                )}

                                {answerGuide.followUpQuestions && answerGuide.followUpQuestions.length > 0 && (
                                  <AnswerBlock>
                                    <BlockTitle>예상 꼬리 질문</BlockTitle>
                                    <FollowUpList>
                                      {answerGuide.followUpQuestions.map((q, i) => (
                                        <FollowUpItem key={i}>• {q}</FollowUpItem>
                                      ))}
                                    </FollowUpList>
                                  </AnswerBlock>
                                )}
                              </AnswerSection>
                            )}

                            <ScoreSection>
                              <SectionLabel>📊 평가 점수</SectionLabel>
                              <ScoreGrid>
                                <ScoreBox color={getScoreColor(detail.evalResumeRelevance)}>
                                  <ScoreBoxLabel>연관성</ScoreBoxLabel>
                                  <ScoreBoxValue>{detail.evalResumeRelevance || '-'}</ScoreBoxValue>
                                </ScoreBox>
                                <ScoreBox color={getScoreColor(detail.evalQuestionDepth)}>
                                  <ScoreBoxLabel>깊이</ScoreBoxLabel>
                                  <ScoreBoxValue>{detail.evalQuestionDepth || '-'}</ScoreBoxValue>
                                </ScoreBox>
                                <ScoreBox color={getScoreColor(detail.evalPracticalRealism)}>
                                  <ScoreBoxLabel>현실성</ScoreBoxLabel>
                                  <ScoreBoxValue>{detail.evalPracticalRealism || '-'}</ScoreBoxValue>
                                </ScoreBox>
                                <ScoreBox color={getScoreColor(detail.evalGuideQuality)}>
                                  <ScoreBoxLabel>가이드</ScoreBoxLabel>
                                  <ScoreBoxValue>{detail.evalGuideQuality || '-'}</ScoreBoxValue>
                                </ScoreBox>
                                <ScoreBox color={getScoreColor(detail.evalDiversity)}>
                                  <ScoreBoxLabel>다양성</ScoreBoxLabel>
                                  <ScoreBoxValue>{detail.evalDiversity || '-'}</ScoreBoxValue>
                                </ScoreBox>
                              </ScoreGrid>
                            </ScoreSection>

                            <MetricsBar>
                              <MetricChip>⏱ {((detail.latencyMs || 0) / 1000).toFixed(1)}s</MetricChip>
                              <MetricChip>🔤 {(detail.inputTokens || 0) + (detail.outputTokens || 0)} 토큰</MetricChip>
                              <MetricChip>💰 ${(detail.estimatedCostUsd || 0).toFixed(4)}</MetricChip>
                              {detail.htmlContent && (
                                <HtmlPreviewButton
                                  onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                      win.document.write(detail.htmlContent || '');
                                      win.document.close();
                                    }
                                  }}
                                >
                                  HTML 미리보기
                                </HtmlPreviewButton>
                              )}
                            </MetricsBar>
                          </QuestionCard>
                        );
                      })}
                    </JobDetailsContainer>
                  )}
                </HistoryItem>
              ))}
            </HistoryList>

            <Pagination>
              <PageButton
                disabled={history.first}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                이전
              </PageButton>
              <PageInfo>
                {history.number + 1} / {history.totalPages} 페이지
              </PageInfo>
              <PageButton
                disabled={history.last}
                onClick={() => setPage(p => p + 1)}
              >
                다음
              </PageButton>
            </Pagination>
          </>
        ) : (
          <EmptyState>벤치마크 히스토리가 없습니다.</EmptyState>
        )}
      </HistorySection>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
`;

const ComparisonSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;

const ComparisonCard = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const ModelName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProviderBadge = styled.span<{ provider: string }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.provider) {
      case 'openai': return '#10a37f20';
      case 'anthropic': return '#d9770620';
      case 'google': return '#4285f420';
      default: return '#6b728020';
    }
  }};
  color: ${props => {
    switch (props.provider) {
      case 'openai': return '#10a37f';
      case 'anthropic': return '#d97706';
      case 'google': return '#4285f4';
      default: return '#6b7280';
    }
  }};
`;

const ModelBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color || '#374151'};
`;

const TokenStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const TokenItem = styled.div`
  text-align: center;
`;

const TokenLabel = styled.div`
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 2px;
`;

const TokenValue = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HistoryItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const HistoryInfo = styled.div`
  flex: 1;
`;

const JobId = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  font-family: monospace;
`;

const HistoryMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const HistoryScore = styled.div<{ color: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.color};
  margin-right: 12px;
`;

const ExpandIcon = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const JobDetailsContainer = styled.div`
  padding: 16px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const QuestionCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const QuestionCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const QuestionNumber = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 6px;
`;

const QuestionType = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-weight: 500;
`;

const QuestionTopic = styled.span`
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
`;

const QuestionScore = styled.div<{ color: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.color};
  background: ${props => props.color}15;
  padding: 6px 12px;
  border-radius: 8px;
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const QuestionSection = styled.div`
  margin-bottom: 16px;
`;

const QuestionText = styled.div`
  font-size: 15px;
  color: #1f2937;
  line-height: 1.7;
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
`;

const ResumeSection = styled.div`
  margin-bottom: 16px;
`;

const ResumeText = styled.div`
  font-size: 13px;
  color: #059669;
  background: #ecfdf5;
  padding: 12px 14px;
  border-radius: 8px;
  line-height: 1.6;
`;

const AnswerSection = styled.div`
  margin-bottom: 16px;
  background: #fafafa;
  padding: 16px;
  border-radius: 10px;
`;

const AnswerBlock = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BlockTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BlockContent = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Keyword = styled.span`
  font-size: 12px;
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 500;
`;

const StarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const StarItem = styled.div`
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const StarLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 6px;
`;

const StarContent = styled.div`
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
`;

const PersonaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PersonaItem = styled.div`
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const PersonaLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const PersonaContent = styled.div`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
`;

const FollowUpList = styled.div`
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const FollowUpItem = styled.div`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ScoreSection = styled.div`
  margin-bottom: 16px;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const ScoreBox = styled.div<{ color: string }>`
  background: ${props => props.color}10;
  border: 1px solid ${props => props.color}30;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
`;

const ScoreBoxLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const ScoreBoxValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: inherit;
`;

const MetricsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
`;

const MetricChip = styled.span`
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 6px;
`;

const HtmlPreviewButton = styled.button`
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;

  &:hover {
    background: #2563eb;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
`;

const PageButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.disabled ? '#f3f4f6' : '#3b82f6'};
  color: ${props => props.disabled ? '#9ca3af' : 'white'};
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: #2563eb;
  }
`;

const PageInfo = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

export default BenchmarkHistoryTab;
