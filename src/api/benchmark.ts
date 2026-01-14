import apiClient from './client';
import type {
  BenchmarkRequest,
  BenchmarkResponse,
  ModelInfo,
  StartBenchmarkResponse,
  JobStatusResponse,
  RagSearchResult,
  BenchmarkHistoryItem,
  BenchmarkJobSummary,
  ModelComparisonStats,
  PageResponse,
  PromptTemplate,
  CreatePromptRequest,
  UpdatePromptRequest
} from '../types/benchmark';
import type { ApiResponse } from '../types/api';

const BENCHMARK_API_BASE = '/query-daily-service/api/v1/admin/benchmark';

/**
 * 벤치마크 시작 (비동기)
 * @param request 벤치마크 요청
 * @returns jobId와 메시지
 */
export const startBenchmark = async (request: BenchmarkRequest): Promise<StartBenchmarkResponse> => {
  const response = await apiClient.post<ApiResponse<StartBenchmarkResponse>>(
    `${BENCHMARK_API_BASE}/start`,
    request
  );
  return response.data.data;
};

/**
 * 벤치마크 작업 상태 조회 (폴링용)
 * @param jobId 작업 ID
 * @returns 작업 상태
 */
export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await apiClient.get<ApiResponse<JobStatusResponse>>(
    `${BENCHMARK_API_BASE}/status/${jobId}`
  );
  return response.data.data;
};

/**
 * 벤치마크 결과 조회 (완료된 작업)
 * @param jobId 작업 ID
 * @returns 벤치마크 결과
 */
export const getJobResult = async (jobId: string): Promise<BenchmarkResponse> => {
  const response = await apiClient.get<ApiResponse<BenchmarkResponse>>(
    `${BENCHMARK_API_BASE}/result/${jobId}`
  );
  return response.data.data;
};

/**
 * 벤치마크 실행 (동기 - 기존 호환용)
 * @param request 벤치마크 요청
 * @returns 벤치마크 결과
 */
export const runBenchmark = async (request: BenchmarkRequest): Promise<BenchmarkResponse> => {
  const response = await apiClient.post<ApiResponse<BenchmarkResponse>>(
    `${BENCHMARK_API_BASE}/run`,
    request,
    {
      timeout: 300000, // 5분 타임아웃
    }
  );
  return response.data.data;
};

/**
 * 사용 가능한 모델 목록 조회
 * @returns 모델 정보 목록
 */
export const getAvailableModels = async (): Promise<ModelInfo[]> => {
  const response = await apiClient.get<ApiResponse<ModelInfo[]>>(
    `${BENCHMARK_API_BASE}/models`
  );
  return response.data.data;
};

/**
 * 임베딩 상태 확인
 * @param resumeId 이력서 ID
 * @returns 임베딩 존재 여부
 */
export const checkEmbedding = async (resumeId: string): Promise<{ exists: boolean; chunkCount: number }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ exists: boolean; chunkCount: number }>>(
      `/query-daily-service/api/v1/admin/embeddings/check/${resumeId}`
    );
    return response.data.data;
  } catch {
    return { exists: false, chunkCount: 0 };
  }
};

/**
 * RAG 테스트 - 이력서 기반 검색
 * @param resumeId 이력서 ID
 * @param query 검색 쿼리
 * @returns 관련 청크 목록
 */
export const searchEmbedding = async (resumeId: string, query: string): Promise<RagSearchResult> => {
  const response = await apiClient.post<ApiResponse<RagSearchResult>>(
    `/query-daily-service/api/v1/admin/embeddings/search`,
    { resumeId, query, topK: 5 }
  );
  return response.data.data;
};

export const getHistory = async (page = 0, size = 20): Promise<PageResponse<BenchmarkJobSummary>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<BenchmarkJobSummary>>>(
    `${BENCHMARK_API_BASE}/history`,
    { params: { page, size } }
  );
  return response.data.data;
};

export const getHistoryByJobId = async (jobId: string): Promise<BenchmarkHistoryItem[]> => {
  const response = await apiClient.get<ApiResponse<BenchmarkHistoryItem[]>>(
    `${BENCHMARK_API_BASE}/history/${jobId}`
  );
  return response.data.data;
};

export const getModelComparison = async (days = 30): Promise<ModelComparisonStats[]> => {
  const response = await apiClient.get<ApiResponse<ModelComparisonStats[]>>(
    `${BENCHMARK_API_BASE}/compare`,
    { params: { days } }
  );
  return response.data.data;
};

export const getHistoryByModel = async (
  provider: string,
  modelName: string,
  page = 0,
  size = 20
): Promise<PageResponse<BenchmarkHistoryItem>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<BenchmarkHistoryItem>>>(
    `${BENCHMARK_API_BASE}/history/model`,
    { params: { provider, modelName, page, size } }
  );
  return response.data.data;
};

const PROMPT_API_BASE = '/query-daily-service/api/v1/admin/prompts';

export const getPrompts = async (): Promise<PromptTemplate[]> => {
  const response = await apiClient.get<ApiResponse<PromptTemplate[]>>(PROMPT_API_BASE);
  return response.data.data;
};

export const createPrompt = async (request: CreatePromptRequest): Promise<PromptTemplate> => {
  const response = await apiClient.post<ApiResponse<PromptTemplate>>(PROMPT_API_BASE, request);
  return response.data.data;
};

export const updatePrompt = async (id: number, request: UpdatePromptRequest): Promise<PromptTemplate> => {
  const response = await apiClient.put<ApiResponse<PromptTemplate>>(`${PROMPT_API_BASE}/${id}`, request);
  return response.data.data;
};

export const activatePrompt = async (id: number): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(`${PROMPT_API_BASE}/${id}/activate`);
};

export const deletePrompt = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`${PROMPT_API_BASE}/${id}`);
};

export const benchmarkApi = {
  startBenchmark,
  getJobStatus,
  getJobResult,
  runBenchmark,
  getAvailableModels,
  checkEmbedding,
  searchEmbedding,
  getHistory,
  getHistoryByJobId,
  getModelComparison,
  getHistoryByModel,
  getPrompts,
  createPrompt,
  updatePrompt,
  activatePrompt,
  deletePrompt,
};

export default benchmarkApi;
