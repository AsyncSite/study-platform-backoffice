/**
 * 벤치마크 관련 타입 정의
 */

export interface ModelConfig {
  provider: string;
  name: string;
  displayName?: string;
  temperature: number;
}

export interface BenchmarkRequest {
  purchaseId: string;
  models: ModelConfig[];
  questionCount: number;
  promptVersion: string;
}

export interface EvaluationScore {
  resumeRelevance: number;
  questionDepth: number;
  practicalRealism: number;
  guideQuality: number;
  diversity: number;
  totalScore: number;
  reasoning: Record<string, string>;
  improvementSuggestions: string[];
}

export interface StarStructure {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface PersonaAnswers {
  bigTech: string;
  unicorn: string;
}

export interface AnswerGuide {
  analysis: string;
  keywords: string[];
  starStructure: StarStructure;
  personaAnswers: PersonaAnswers;
  followUpQuestions: string[];
}

export interface DuplicateMatch {
  modelName: string;
  questionNumber: number;
  matchType: string;
  similarity: number;
  matchedTopic: string;
  commonKeywords: string[];
}

export interface DuplicateScore {
  hasDuplicate: boolean;
  topicSimilarity: number;
  semanticSimilarity: number;
  keywordOverlap: number;
  overallScore: number;
  matches: DuplicateMatch[];
}

export interface QuestionResult {
  questionNumber: number;
  questionType: string;
  questionTopic: string;
  questionContent: string;
  resumeReference: string;
  answerGuide: AnswerGuide;
  evaluation: EvaluationScore;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  duplicateScore?: DuplicateScore;
}

export interface Summary {
  avgTotalScore: number;
  avgResumeRelevance: number;
  avgQuestionDepth: number;
  avgPracticalRealism: number;
  avgGuideQuality: number;
  avgDiversity: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  successCount: number;
  failureCount: number;
}

export interface ModelResult {
  model: ModelConfig;
  questions: QuestionResult[];
  summary: Summary;
  error?: string;
}

export interface PurchaseInfo {
  purchaseId: string;
  memberId: string;
  memberName: string | null;
  resumeId: string;
}

export interface BenchmarkResponse {
  purchaseInfo: PurchaseInfo;
  results: ModelResult[];
}

export interface ModelInfo {
  provider: string;
  name: string;
  displayName: string;
  description: string;
}

// 비동기 벤치마크 관련 타입
export interface StartBenchmarkResponse {
  jobId: string;
  message: string;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progressMessage: string;
  progressPercentage: number;
  completedModels: number;
  totalModels: number;
  completedQuestions: number;
  totalQuestionsPerModel: number;
  errorMessage: string | null;
  partialResults: ModelResult[];
}

export interface RagChunk {
  content: string;
  score: number;
  metadata?: Record<string, string>;
}

export interface RagSearchResult {
  resumeId: string;
  query: string;
  chunks: RagChunk[];
}

export const PROMPT_VERSIONS = ['v1', 'v2', 'v3'] as const;
export type PromptVersion = typeof PROMPT_VERSIONS[number];

export interface BenchmarkHistoryItem {
  id: number;
  jobId: string;
  purchaseId: string;
  memberId: string;
  resumeId: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  promptVersion: string;
  questionNumber: number;
  questionType: string;
  questionTopic: string;
  questionContent: string;
  resumeReference: string | null;
  answerGuideJson: string | null;
  htmlContent: string | null;
  evalTotalScore: number | null;
  evalResumeRelevance: number | null;
  evalQuestionDepth: number | null;
  evalPracticalRealism: number | null;
  evalGuideQuality: number | null;
  evalDiversity: number | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  createdAt: string;
}

export interface ModelComparisonStats {
  modelProvider: string;
  modelName: string;
  avgTotalScore: number;
  avgLatencyMs: number;
  totalQuestions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface BenchmarkJobSummary {
  jobId: string;
  purchaseId: string;
  promptVersion: string;
  modelNames: string[];
  totalQuestions: number;
  avgTotalScore: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  createdAt: string;
}

export type PromptType = 'QUESTION_GENERATION' | 'EVALUATION';

export interface PromptTemplate {
  id: number;
  promptType: PromptType;
  version: number;
  name: string;
  content: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  promptType: PromptType;
  name?: string;
  content: string;
  description?: string;
}

export interface UpdatePromptRequest {
  name?: string;
  content?: string;
  description?: string;
}
