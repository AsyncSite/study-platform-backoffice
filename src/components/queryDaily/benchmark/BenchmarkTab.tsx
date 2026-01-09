import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { benchmarkApi } from '../../../api/benchmark';
import type {
  BenchmarkRequest,
  BenchmarkResponse,
  ModelInfo,
  JobStatusResponse,
  JobStatus,
  PROMPT_VERSIONS,
} from '../../../types/benchmark';
import type { PurchaseAdmin } from '../../../services/queryDailyService';
import queryDailyService from '../../../services/queryDailyService';
import BenchmarkHistoryTab from './BenchmarkHistoryTab';
import PromptManagementTab from './PromptManagementTab';

const POLLING_INTERVAL = 2000;
const PROMPT_VERSION_OPTIONS: Array<typeof PROMPT_VERSIONS[number]> = ['v1', 'v2', 'v3'];

const EVALUATION_LABELS: Record<string, string> = {
  resumeRelevance: '연관성',
  questionDepth: '깊이',
  practicalRealism: '현실성',
  guideQuality: '가이드',
  diversity: '다양성',
};

type TabType = 'run' | 'history' | 'prompts';

const BenchmarkTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('run');
  const [purchases, setPurchases] = useState<PurchaseAdmin[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o', 'gpt-4o-mini']);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [promptVersion, setPromptVersion] = useState<string>('v1');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [result, setResult] = useState<BenchmarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);
  const [activePersonaTab, setActivePersonaTab] = useState<'bigTech' | 'unicorn'>('bigTech');

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  void currentJobId;

  const [embeddingStatus, setEmbeddingStatus] = useState<{ exists: boolean; chunkCount: number } | null>(null);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<{ content: string; score: number }[]>([]);
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [showRagPanel, setShowRagPanel] = useState(false);

  useEffect(() => {
    loadPurchases();
    loadAvailableModels();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedPurchaseId) {
      const purchase = purchases.find(p => p.purchaseId === selectedPurchaseId);
      if (purchase?.resumeId) {
        checkEmbeddingStatus(purchase.resumeId);
      }
    }
  }, [selectedPurchaseId, purchases]);

  const loadPurchases = async () => {
    setIsLoadingPurchases(true);
    try {
      const data = await queryDailyService.getPurchases();
      const purchasesWithResume = data.filter((p: PurchaseAdmin) => p.resumeId);
      setPurchases(purchasesWithResume);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await benchmarkApi.getAvailableModels();
      if (models && models.length > 0) {
        setAvailableModels(models);
      }
    } catch (err) {
      console.error('Failed to load models, using defaults:', err);
      setAvailableModels([
        { provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', description: '최고 성능 모델' },
        { provider: 'openai', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', description: '빠르고 저렴한 모델' },
        { provider: 'anthropic', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', description: 'Anthropic 최신 모델' },
        { provider: 'google', name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Google 최신 모델' },
      ]);
    }
  };

  const checkEmbeddingStatus = async (resumeId: string) => {
    try {
      const status = await benchmarkApi.checkEmbedding(resumeId);
      setEmbeddingStatus(status);
    } catch {
      setEmbeddingStatus({ exists: false, chunkCount: 0 });
    }
  };

  const handleRagSearch = async () => {
    const purchase = purchases.find(p => p.purchaseId === selectedPurchaseId);
    if (!purchase?.resumeId || !ragQuery.trim()) return;

    setIsRagLoading(true);
    try {
      const result = await benchmarkApi.searchEmbedding(purchase.resumeId, ragQuery);
      setRagResults(result.chunks || []);
    } catch (err) {
      console.error('RAG search failed:', err);
      setRagResults([]);
    } finally {
      setIsRagLoading(false);
    }
  };

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev =>
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const startPolling = (jobId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const poll = async () => {
      try {
        const status = await benchmarkApi.getJobStatus(jobId);
        setJobStatus(status);

        if (status.status === 'COMPLETED') {
          stopPolling();
          const resultData = await benchmarkApi.getJobResult(jobId);
          setResult(resultData);
          setIsLoading(false);
          setCurrentJobId(null);
        } else if (status.status === 'FAILED') {
          stopPolling();
          setError(status.errorMessage || '벤치마크 실행 중 오류가 발생했습니다');
          setIsLoading(false);
          setCurrentJobId(null);
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleRunBenchmark = async () => {
    if (!selectedPurchaseId) {
      setError('구매를 선택해주세요');
      return;
    }
    if (selectedModels.length === 0) {
      setError('최소 1개 이상의 모델을 선택해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setJobStatus(null);

    try {
      const request: BenchmarkRequest = {
        purchaseId: selectedPurchaseId,
        models: selectedModels.map(name => {
          const modelInfo = availableModels.find(m => m.name === name);
          return {
            provider: modelInfo?.provider || 'openai',
            name,
            temperature,
          };
        }),
        questionCount,
        promptVersion,
      };

      const { jobId } = await benchmarkApi.startBenchmark(request);
      setCurrentJobId(jobId);
      startPolling(jobId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '벤치마크 시작 중 오류가 발생했습니다';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    stopPolling();
    setIsLoading(false);
    setCurrentJobId(null);
    setJobStatus(null);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getStatusText = (status: JobStatus): string => {
    const statusMap: Record<JobStatus, string> = {
      PENDING: '준비 중...',
      RUNNING: '실행 중...',
      COMPLETED: '완료',
      FAILED: '실패',
    };
    return statusMap[status] || status;
  };

  const exportToCSV = () => {
    if (!result) return;

    const headers = ['모델', '질문번호', '유형', '주제', '연관성', '깊이', '현실성', '가이드', '다양성', '총점', '지연(ms)', '비용($)'];
    const rows: string[][] = [];

    result.results.forEach(modelResult => {
      modelResult.questions.forEach(q => {
        rows.push([
          modelResult.model.name,
          q.questionNumber.toString(),
          q.questionType,
          q.questionTopic,
          q.evaluation.resumeRelevance.toString(),
          q.evaluation.questionDepth.toString(),
          q.evaluation.practicalRealism.toString(),
          q.evaluation.guideQuality.toString(),
          q.evaluation.diversity.toString(),
          q.evaluation.totalScore.toFixed(1),
          q.latencyMs.toString(),
          ((q.inputTokens * 0.00001) + (q.outputTokens * 0.00003)).toFixed(6),
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `benchmark_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const prepareRadarData = () => {
    if (!result) return [];
    return [
      { metric: '연관성', ...Object.fromEntries(result.results.map(r => [r.model.name, r.summary.avgResumeRelevance * 10])) },
      { metric: '깊이', ...Object.fromEntries(result.results.map(r => [r.model.name, r.summary.avgQuestionDepth * 10])) },
      { metric: '현실성', ...Object.fromEntries(result.results.map(r => [r.model.name, r.summary.avgPracticalRealism * 10])) },
      { metric: '가이드', ...Object.fromEntries(result.results.map(r => [r.model.name, r.summary.avgGuideQuality * 10])) },
      { metric: '다양성', ...Object.fromEntries(result.results.map(r => [r.model.name, r.summary.avgDiversity * 10])) },
    ];
  };

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

  const selectedPurchase = purchases.find(p => p.purchaseId === selectedPurchaseId);

  return (
    <Container>
      <TabNavigation>
        <TabButton active={activeTab === 'run'} onClick={() => setActiveTab('run')}>
          벤치마크 실행
        </TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          히스토리
        </TabButton>
        <TabButton active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')}>
          프롬프트 관리
        </TabButton>
      </TabNavigation>

      {activeTab === 'history' ? (
        <BenchmarkHistoryTab />
      ) : activeTab === 'prompts' ? (
        <PromptManagementTab />
      ) : (
      <>
      <ConfigSection>
        <SectionTitle>벤치마크 설정</SectionTitle>

        <ConfigRow>
          <Label>구매 선택</Label>
          <Select
            value={selectedPurchaseId}
            onChange={(e) => setSelectedPurchaseId(e.target.value)}
            disabled={isLoadingPurchases || isLoading}
          >
            <option value="">-- 구매 선택 --</option>
            {purchases.map(purchase => (
              <option key={purchase.purchaseId} value={purchase.purchaseId}>
                {purchase.memberName || purchase.memberEmail} - {purchase.productCode} ({purchase.purchaseId.slice(0, 8)}...)
              </option>
            ))}
          </Select>
        </ConfigRow>

        {selectedPurchase && (
          <SelectedInfo>
            <InfoItem><strong>이메일:</strong> {selectedPurchase.memberEmail}</InfoItem>
            <InfoItem><strong>상품:</strong> {selectedPurchase.productCode}</InfoItem>
            <InfoItem><strong>이력서:</strong> {selectedPurchase.resumeId?.slice(0, 16)}...</InfoItem>
            {embeddingStatus && (
              <EmbeddingBadge exists={embeddingStatus.exists}>
                {embeddingStatus.exists 
                  ? `✓ 임베딩 완료 (${embeddingStatus.chunkCount}개 청크)` 
                  : '✗ 임베딩 없음'}
              </EmbeddingBadge>
            )}
          </SelectedInfo>
        )}

        {selectedPurchase && embeddingStatus?.exists && (
          <RagToggle>
            <RagToggleButton onClick={() => setShowRagPanel(!showRagPanel)}>
              {showRagPanel ? '▼ RAG 테스트 숨기기' : '▶ RAG 테스트 보기'}
            </RagToggleButton>
            {showRagPanel && (
              <RagPanel>
                <RagInputRow>
                  <RagInput
                    placeholder="이력서 기반 검색 쿼리 입력..."
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRagSearch()}
                  />
                  <RagSearchButton onClick={handleRagSearch} disabled={isRagLoading}>
                    {isRagLoading ? '검색 중...' : '검색'}
                  </RagSearchButton>
                </RagInputRow>
                {ragResults.length > 0 && (
                  <RagResultsList>
                    {ragResults.map((chunk, idx) => (
                      <RagResultItem key={idx}>
                        <RagScore>유사도: {(chunk.score * 100).toFixed(1)}%</RagScore>
                        <RagContent>{chunk.content}</RagContent>
                      </RagResultItem>
                    ))}
                  </RagResultsList>
                )}
              </RagPanel>
            )}
          </RagToggle>
        )}

        <ConfigRow>
          <Label>모델 선택</Label>
          <ModelGrid>
            {availableModels.map(model => (
              <ModelCheckbox key={model.name}>
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.name)}
                  onChange={() => handleModelToggle(model.name)}
                  disabled={isLoading}
                />
                <ModelLabel>
                  <ModelName>
                    <ProviderBadge provider={model.provider}>{model.provider}</ProviderBadge>
                    {model.displayName}
                  </ModelName>
                  <ModelDesc>{model.description}</ModelDesc>
                </ModelLabel>
              </ModelCheckbox>
            ))}
          </ModelGrid>
        </ConfigRow>

        <ConfigGrid>
          <ConfigRow>
            <Label>프롬프트 버전</Label>
            <Select
              value={promptVersion}
              onChange={(e) => setPromptVersion(e.target.value)}
              disabled={isLoading}
              style={{ width: '120px' }}
            >
              {PROMPT_VERSION_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
          </ConfigRow>

          <ConfigRow>
            <Label>Temperature ({temperature.toFixed(1)})</Label>
            <SliderContainer>
              <Slider
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isLoading}
              />
              <SliderLabels>
                <span>정확</span>
                <span>창의</span>
              </SliderLabels>
            </SliderContainer>
          </ConfigRow>

          <ConfigRow>
            <Label>질문 개수</Label>
            <NumberInput
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
          </ConfigRow>
        </ConfigGrid>

        <ButtonRow>
          <RunButton
            onClick={handleRunBenchmark}
            disabled={isLoading || !selectedPurchaseId || selectedModels.length === 0}
          >
            {isLoading ? '벤치마크 실행 중...' : '벤치마크 실행'}
          </RunButton>
          {isLoading && (
            <CancelButton onClick={handleCancel}>취소</CancelButton>
          )}
          {result && (
            <ExportButton onClick={exportToCSV}>CSV 내보내기</ExportButton>
          )}
        </ButtonRow>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ConfigSection>

      {isLoading && jobStatus && (
        <ProgressSection>
          <ProgressHeader>
            <ProgressTitle>벤치마크 진행 중</ProgressTitle>
            <StatusBadge status={jobStatus.status}>{getStatusText(jobStatus.status)}</StatusBadge>
          </ProgressHeader>
          <ProgressBarContainer>
            <ProgressBar progress={jobStatus.progressPercentage} />
            <ProgressText>{jobStatus.progressPercentage.toFixed(1)}%</ProgressText>
          </ProgressBarContainer>
          <ProgressMessage>{jobStatus.progressMessage}</ProgressMessage>
          <ProgressDetails>
            <ProgressDetail>모델: {jobStatus.completedModels}/{jobStatus.totalModels}</ProgressDetail>
            <ProgressDetail>질문: {jobStatus.completedQuestions}/{jobStatus.totalQuestionsPerModel}</ProgressDetail>
          </ProgressDetails>
        </ProgressSection>
      )}

      {result && (
        <ResultSection>
          <SectionHeader>
            <SectionTitle>벤치마크 결과</SectionTitle>
            <ConfigBadges>
              <ConfigBadge>프롬프트: {promptVersion}</ConfigBadge>
              <ConfigBadge>Temperature: {temperature}</ConfigBadge>
            </ConfigBadges>
          </SectionHeader>

          <ChartSection>
            <ChartTitle>모델 성능 비교</ChartTitle>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={prepareRadarData()} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 14, fill: '#374151' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                {result.results.map((modelResult, idx) => (
                  <Radar
                    key={modelResult.model.name}
                    name={modelResult.model.name}
                    dataKey={modelResult.model.name}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartSection>

          <SummaryGrid>
            {result.results.map((modelResult, idx) => (
              <SummaryCard key={idx} hasError={!!modelResult.error}>
                <ModelHeader>
                  <ProviderBadge provider={modelResult.model.provider}>{modelResult.model.provider}</ProviderBadge>
                  {modelResult.model.name}
                </ModelHeader>
                {modelResult.error ? (
                  <ErrorText>{modelResult.error}</ErrorText>
                ) : (
                  <>
                    <ScoreDisplay color={getScoreColor(modelResult.summary.avgTotalScore)}>
                      {modelResult.summary.avgTotalScore.toFixed(1)}
                    </ScoreDisplay>
                    <ScoreGrid>
                      {Object.entries(EVALUATION_LABELS).map(([key, label]) => {
                        const rawScore = modelResult.summary[`avg${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof modelResult.summary];
                        const score = typeof rawScore === 'number' ? (rawScore * 10).toFixed(0) : '-';
                        return (
                          <ScoreItem key={key}>
                            <ScoreLabel>{label}</ScoreLabel>
                            <ScoreValue>{score}</ScoreValue>
                          </ScoreItem>
                        );
                      })}
                    </ScoreGrid>
                    <MetricsRow>
                      <Metric>{(modelResult.summary.avgLatencyMs / 1000).toFixed(1)}s</Metric>
                      <Metric>${modelResult.summary.totalCostUsd.toFixed(4)}</Metric>
                    </MetricsRow>
                  </>
                )}
              </SummaryCard>
            ))}
          </SummaryGrid>

          <DetailSection>
            <SectionSubTitle>상세 질문 비교</SectionSubTitle>
            {result.results[0]?.questions.map((_, qIdx) => (
              <QuestionCompareRow key={qIdx}>
                <QuestionHeader onClick={() => setExpandedQuestionId(expandedQuestionId === `q-${qIdx}` ? null : `q-${qIdx}`)}>
                  질문 #{qIdx + 1}
                  <ExpandIcon>{expandedQuestionId === `q-${qIdx}` ? '▼' : '▶'}</ExpandIcon>
                </QuestionHeader>

                {expandedQuestionId === `q-${qIdx}` && (
                  <QuestionDetails>
                    {result.results.map((modelResult, mIdx) => {
                      const question = modelResult.questions[qIdx];
                      if (!question) return null;
                      const reasoningKey = `${mIdx}-${qIdx}`;

                      return (
                        <QuestionCard key={mIdx}>
                          <QuestionCardHeader>
                            <ModelTag>{modelResult.model.name}</ModelTag>
                            <TypeTag>{question.questionType}</TypeTag>
                            <TopicTag>{question.questionTopic}</TopicTag>
                          </QuestionCardHeader>
                          
                          <QuestionContent>{question.questionContent}</QuestionContent>
                          
                          <EvalScores>
                            <EvalScore>연관성: {question.evaluation.resumeRelevance * 10}</EvalScore>
                            <EvalScore>깊이: {question.evaluation.questionDepth * 10}</EvalScore>
                            <EvalScore>현실성: {question.evaluation.practicalRealism * 10}</EvalScore>
                            <EvalScore>가이드: {question.evaluation.guideQuality * 10}</EvalScore>
                            <EvalScore>다양성: {question.evaluation.diversity * 10}</EvalScore>
                            <EvalTotal color={getScoreColor(question.evaluation.totalScore)}>
                              총점: {question.evaluation.totalScore.toFixed(0)}
                            </EvalTotal>
                          </EvalScores>

                          {question.duplicateScore && (
                            <DuplicateSection hasDuplicate={question.duplicateScore.hasDuplicate}>
                              <DuplicateHeader>
                                <DuplicateTitle>
                                  {question.duplicateScore.hasDuplicate ? '⚠️ 중복 감지' : '✓ 중복 없음'}
                                </DuplicateTitle>
                                <DuplicateOverall score={question.duplicateScore.overallScore}>
                                  유사도: {(question.duplicateScore.overallScore * 100).toFixed(0)}%
                                </DuplicateOverall>
                              </DuplicateHeader>
                              <DuplicateScores>
                                <DuplicateScoreItem>
                                  <DuplicateScoreLabel>토픽</DuplicateScoreLabel>
                                  <DuplicateScoreBar width={question.duplicateScore.topicSimilarity * 100} />
                                  <DuplicateScoreValue>{(question.duplicateScore.topicSimilarity * 100).toFixed(0)}%</DuplicateScoreValue>
                                </DuplicateScoreItem>
                                <DuplicateScoreItem>
                                  <DuplicateScoreLabel>의미</DuplicateScoreLabel>
                                  <DuplicateScoreBar width={question.duplicateScore.semanticSimilarity * 100} />
                                  <DuplicateScoreValue>{(question.duplicateScore.semanticSimilarity * 100).toFixed(0)}%</DuplicateScoreValue>
                                </DuplicateScoreItem>
                                <DuplicateScoreItem>
                                  <DuplicateScoreLabel>키워드</DuplicateScoreLabel>
                                  <DuplicateScoreBar width={question.duplicateScore.keywordOverlap * 100} />
                                  <DuplicateScoreValue>{(question.duplicateScore.keywordOverlap * 100).toFixed(0)}%</DuplicateScoreValue>
                                </DuplicateScoreItem>
                              </DuplicateScores>
                              {question.duplicateScore.matches.length > 0 && (
                                <DuplicateMatches>
                                  {question.duplicateScore.matches.map((match, i) => (
                                    <DuplicateMatchItem key={i}>
                                      <MatchModel>{match.modelName}</MatchModel>
                                      <MatchType>{match.matchType}</MatchType>
                                      <MatchTopic>"{match.matchedTopic}"</MatchTopic>
                                      {match.commonKeywords.length > 0 && (
                                        <MatchKeywords>공통: {match.commonKeywords.join(', ')}</MatchKeywords>
                                      )}
                                    </DuplicateMatchItem>
                                  ))}
                                </DuplicateMatches>
                              )}
                            </DuplicateSection>
                          )}

                          <ReasoningToggle onClick={() => setExpandedReasoningId(expandedReasoningId === reasoningKey ? null : reasoningKey)}>
                            {expandedReasoningId === reasoningKey ? '▼ 평가 상세 숨기기' : '▶ 평가 상세 보기'}
                          </ReasoningToggle>
                          
                          {expandedReasoningId === reasoningKey && (
                            <ReasoningSection>
                              <ReasoningTitle>평가 근거</ReasoningTitle>
                              {Object.entries(question.evaluation.reasoning || {}).map(([key, value]) => (
                                <ReasoningItem key={key}>
                                  <ReasoningLabel>{EVALUATION_LABELS[key] || key}</ReasoningLabel>
                                  <ReasoningText>{value}</ReasoningText>
                                </ReasoningItem>
                              ))}
                              {question.evaluation.improvementSuggestions?.length > 0 && (
                                <ImprovementSection>
                                  <ReasoningTitle>개선 제안</ReasoningTitle>
                                  <ImprovementList>
                                    {question.evaluation.improvementSuggestions.map((s, i) => (
                                      <ImprovementItem key={i}>{s}</ImprovementItem>
                                    ))}
                                  </ImprovementList>
                                </ImprovementSection>
                              )}
                            </ReasoningSection>
                          )}

                          {question.answerGuide && (
                            <AnswerGuideSection>
                              <AnswerGuideTitle>답변 가이드</AnswerGuideTitle>
                              
                              <StarSection>
                                <StarTitle>STAR 구조</StarTitle>
                                <StarGrid>
                                  <StarItem>
                                    <StarLabel>S - Situation</StarLabel>
                                    <StarContent>{question.answerGuide.starStructure?.situation || '-'}</StarContent>
                                  </StarItem>
                                  <StarItem>
                                    <StarLabel>T - Task</StarLabel>
                                    <StarContent>{question.answerGuide.starStructure?.task || '-'}</StarContent>
                                  </StarItem>
                                  <StarItem>
                                    <StarLabel>A - Action</StarLabel>
                                    <StarContent>{question.answerGuide.starStructure?.action || '-'}</StarContent>
                                  </StarItem>
                                  <StarItem>
                                    <StarLabel>R - Result</StarLabel>
                                    <StarContent>{question.answerGuide.starStructure?.result || '-'}</StarContent>
                                  </StarItem>
                                </StarGrid>
                              </StarSection>

                              <PersonaSection>
                                <PersonaTabs>
                                  <PersonaTab 
                                    active={activePersonaTab === 'bigTech'} 
                                    onClick={() => setActivePersonaTab('bigTech')}
                                  >
                                    🏢 빅테크 스타일
                                  </PersonaTab>
                                  <PersonaTab 
                                    active={activePersonaTab === 'unicorn'} 
                                    onClick={() => setActivePersonaTab('unicorn')}
                                  >
                                    🚀 유니콘 스타일
                                  </PersonaTab>
                                </PersonaTabs>
                                <PersonaContent>
                                  {activePersonaTab === 'bigTech' 
                                    ? question.answerGuide.personaAnswers?.bigTech 
                                    : question.answerGuide.personaAnswers?.unicorn}
                                </PersonaContent>
                              </PersonaSection>

                              <KeywordSection>
                                <KeywordTitle>핵심 키워드</KeywordTitle>
                                <KeywordList>
                                  {question.answerGuide.keywords?.map((kw, i) => (
                                    <Keyword key={i}>{kw}</Keyword>
                                  ))}
                                </KeywordList>
                              </KeywordSection>

                              {question.answerGuide.followUpQuestions?.length > 0 && (
                                <FollowUpSection>
                                  <FollowUpTitle>예상 후속 질문</FollowUpTitle>
                                  <FollowUpList>
                                    {question.answerGuide.followUpQuestions.map((fq, i) => (
                                      <FollowUpItem key={i}>{fq}</FollowUpItem>
                                    ))}
                                  </FollowUpList>
                                </FollowUpSection>
                              )}
                            </AnswerGuideSection>
                          )}
                        </QuestionCard>
                      );
                    })}
                  </QuestionDetails>
                )}
              </QuestionCompareRow>
            ))}
          </DetailSection>
        </ResultSection>
      )}
      </>
      )}
    </Container>
  );
};

const TabNavigation = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  border: none;
  background: ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f3f4f6'};
  }
`;

const Container = styled.div`
  padding: 20px;
`;

const ConfigSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1f2937;
`;

const SectionSubTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #374151;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ConfigBadges = styled.div`
  display: flex;
  gap: 8px;
`;

const ConfigBadge = styled.span`
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
`;

const ConfigRow = styled.div`
  margin-bottom: 16px;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
`;

const Select = styled.select`
  width: 100%;
  max-width: 500px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const SelectedInfo = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  margin-bottom: 16px;
  align-items: center;
`;

const InfoItem = styled.span`
  font-size: 13px;
  color: #4b5563;
`;

const EmbeddingBadge = styled.span<{ exists: boolean }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.exists ? '#d1fae5' : '#fef2f2'};
  color: ${props => props.exists ? '#065f46' : '#dc2626'};
`;

const RagToggle = styled.div`
  margin-bottom: 16px;
`;

const RagToggleButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RagPanel = styled.div`
  margin-top: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
`;

const RagInputRow = styled.div`
  display: flex;
  gap: 8px;
`;

const RagInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

const RagSearchButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  
  &:disabled {
    background: #9ca3af;
  }
`;

const RagResultsList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RagResultItem = styled.div`
  padding: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
`;

const RagScore = styled.span`
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
`;

const RagContent = styled.p`
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  margin: 0;
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`;

const ModelCheckbox = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  input[type="checkbox"] {
    margin-top: 2px;
  }
`;

const ModelLabel = styled.div`
  flex: 1;
`;

const ModelName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
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
      case 'anthropic': return '#d97706 20';
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

const ModelDesc = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const SliderContainer = styled.div`
  max-width: 200px;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
`;

const NumberInput = styled.input`
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const RunButton = styled.button`
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const ExportButton = styled.button`
  padding: 12px 24px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #047857;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
`;

const ProgressSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProgressTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const StatusBadge = styled.span<{ status: JobStatus }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'RUNNING': return '#dbeafe';
      case 'COMPLETED': return '#d1fae5';
      case 'FAILED': return '#fef2f2';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'RUNNING': return '#1d4ed8';
      case 'COMPLETED': return '#065f46';
      case 'FAILED': return '#dc2626';
      default: return '#6b7280';
    }
  }};
`;

const ProgressBarContainer = styled.div`
  position: relative;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: #374151;
`;

const ProgressMessage = styled.div`
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
`;

const ProgressDetails = styled.div`
  display: flex;
  gap: 20px;
`;

const ProgressDetail = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const ResultSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ChartSection = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
`;

const ChartTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  text-align: center;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div<{ hasError?: boolean }>`
  padding: 20px;
  border: 1px solid ${props => props.hasError ? '#fecaca' : '#e5e7eb'};
  border-radius: 8px;
  background: ${props => props.hasError ? '#fef2f2' : 'white'};
`;

const ModelHeader = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScoreDisplay = styled.div<{ color: string }>`
  font-size: 48px;
  font-weight: 700;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 16px;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const ScoreItem = styled.div`
  text-align: center;
`;

const ScoreLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
`;

const ScoreValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const MetricsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const Metric = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 14px;
`;

const DetailSection = styled.div`
  margin-top: 24px;
`;

const QuestionCompareRow = styled.div`
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #f3f4f6;
  }
`;

const ExpandIcon = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const QuestionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
  padding: 16px;
`;

const QuestionCard = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const QuestionCardHeader = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const ModelTag = styled.span`
  padding: 4px 8px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const TypeTag = styled.span`
  padding: 4px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 12px;
`;

const TopicTag = styled.span`
  padding: 4px 8px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 4px;
  font-size: 12px;
`;

const QuestionContent = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 12px;
`;

const EvalScores = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const EvalScore = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const EvalTotal = styled.span<{ color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color};
`;

const ReasoningToggle = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 0;
  margin-bottom: 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ReasoningSection = styled.div`
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  margin-bottom: 12px;
`;

const ReasoningTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
`;

const ReasoningItem = styled.div`
  margin-bottom: 8px;
`;

const ReasoningLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #78350f;
`;

const ReasoningText = styled.p`
  font-size: 12px;
  color: #92400e;
  margin: 4px 0 0 0;
  line-height: 1.5;
`;

const ImprovementSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #fcd34d;
`;

const ImprovementList = styled.ul`
  margin: 0;
  padding-left: 16px;
`;

const ImprovementItem = styled.li`
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
`;

const AnswerGuideSection = styled.div`
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const AnswerGuideTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
`;

const StarSection = styled.div`
  margin-bottom: 16px;
`;

const StarTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const StarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const StarItem = styled.div`
  padding: 10px;
  background: #f0fdf4;
  border-radius: 6px;
`;

const StarLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 4px;
`;

const StarContent = styled.div`
  font-size: 12px;
  color: #15803d;
  line-height: 1.5;
`;

const PersonaSection = styled.div`
  margin-bottom: 16px;
`;

const PersonaTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const PersonaTab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.active ? '#dbeafe' : 'white'};
  color: ${props => props.active ? '#1d4ed8' : '#6b7280'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.active ? '#dbeafe' : '#f9fafb'};
  }
`;

const PersonaContent = styled.div`
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
`;

const KeywordSection = styled.div`
  margin-bottom: 12px;
`;

const KeywordTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Keyword = styled.span`
  padding: 4px 10px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
  font-size: 12px;
`;

const FollowUpSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const FollowUpTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const FollowUpList = styled.ol`
  margin: 0;
  padding-left: 20px;
`;

const FollowUpItem = styled.li`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 4px;
`;

const DuplicateSection = styled.div<{ hasDuplicate: boolean }>`
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.hasDuplicate ? '#fef2f2' : '#f0fdf4'};
  border: 1px solid ${props => props.hasDuplicate ? '#fecaca' : '#bbf7d0'};
`;

const DuplicateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const DuplicateTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

const DuplicateOverall = styled.span<{ score: number }>`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.score > 0.5 ? '#dc2626' : props.score > 0.3 ? '#f59e0b' : '#22c55e'};
`;

const DuplicateScores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DuplicateScoreItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DuplicateScoreLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  width: 40px;
`;

const DuplicateScoreBar = styled.div<{ width: number }>`
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(props.width, 100)}%;
    background: ${props => props.width > 70 ? '#ef4444' : props.width > 50 ? '#f59e0b' : '#22c55e'};
    border-radius: 3px;
    transition: width 0.3s ease;
  }
`;

const DuplicateScoreValue = styled.span`
  font-size: 11px;
  color: #374151;
  width: 35px;
  text-align: right;
`;

const DuplicateMatches = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #fecaca;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DuplicateMatchItem = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 11px;
`;

const MatchModel = styled.span`
  padding: 2px 6px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-weight: 500;
`;

const MatchType = styled.span`
  padding: 2px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
`;

const MatchTopic = styled.span`
  color: #6b7280;
  font-style: italic;
`;

const MatchKeywords = styled.span`
  color: #059669;
  font-size: 10px;
`;

export default BenchmarkTab;
