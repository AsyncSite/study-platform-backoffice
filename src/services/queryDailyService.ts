import apiClient from '../api/client';
import { env } from '../config/environment';

export interface QueryApplication {
  id: number;
  memberId: string;
  email: string;
  name: string;
  resumeFileName: string;
  resumeAssetId: string;
  createdAt: string;
}

class QueryDailyService {
  /**
   * 전체 베타 테스트 신청자 목록 조회
   */
  async getAllApplications(): Promise<QueryApplication[]> {
    try {
      const response = await apiClient.get('/api/query-daily/admin/leads');
      console.log('✅ Fetched applications:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch applications:', error);
      // 401 에러는 apiClient interceptor에서 처리하도록 그대로 throw
      throw error;
    }
  }

  /**
   * 특정 신청자 정보 조회
   */
  async getApplication(id: number): Promise<QueryApplication> {
    try {
      const response = await apiClient.get(`/api/query-daily/admin/leads/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch application:', error);
      throw error;
    }
  }

  /**
   * Asset 다운로드 URL 생성
   */
  getAssetDownloadUrl(assetId: string): string {
    // Gateway를 통해 Asset Service 접근
    return `${env.apiBaseUrl}/api/assets/${assetId}/download?download=true`;
  }

  /**
   * 이력서 미리보기 URL 생성 (브라우저에서 직접 열기)
   */
  getAssetPreviewUrl(assetId: string): string {
    return `${env.apiBaseUrl}/api/assets/${assetId}/download`;
  }

  /**
   * Asset 파일 다운로드 (JWT 토큰 포함)
   */
  async downloadAsset(assetId: string, fileName: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/assets/${assetId}/download`, {
        responseType: 'blob',
        params: { download: true }
      });

      // Blob URL 생성
      const url = window.URL.createObjectURL(response.data);

      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();

      // 정리
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Asset downloaded:', fileName);
    } catch (error: any) {
      console.error('❌ Failed to download asset:', error);
      throw error;
    }
  }
}

export default new QueryDailyService();