import apiClient from './client';

export interface AssetUploadResponse {
  assetId: string;
  fileHash: string;
  fileName: string;
  publicUrl: string;
  privateUrl: string;
  fileSize: number;
  mimeType: string;
}

export const assetApi = {
  /**
   * Upload a file to asset-service
   * @param file - File to upload
   * @param options - Upload options
   * @returns Uploaded asset info with publicUrl
   */
  upload: async (
    file: File,
    options?: {
      visibility?: 'PUBLIC' | 'PRIVATE';
      category?: string;
      tags?: string;
    }
  ): Promise<AssetUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', options?.visibility ?? 'PUBLIC');
    if (options?.category) {
      formData.append('category', options.category);
    }
    if (options?.tags) {
      formData.append('tags', options.tags);
    }

    const response = await apiClient.post('/api/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    const data = response.data;
    return data.data || data;
  },
};
