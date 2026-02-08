import apiClient from './client';

// Domain enums
export type ProductType = 'EBOOK' | 'COURSE' | 'TEMPLATE' | 'NEWSLETTER_ARCHIVE' | 'BUNDLE' | 'DIGITAL_ASSET';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type PricingType = 'ONE_TIME' | 'SUBSCRIPTION';
export type AssetType = 'FILE' | 'URL' | 'STREAMING_CONTENT';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  EBOOK: '전자책',
  COURSE: '강의',
  TEMPLATE: '템플릿',
  NEWSLETTER_ARCHIVE: '뉴스레터 아카이브',
  BUNDLE: '번들',
  DIGITAL_ASSET: '디지털 자산',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: '초안',
  ACTIVE: '활성',
  ARCHIVED: '보관',
};

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  ONE_TIME: '일회성',
  SUBSCRIPTION: '구독',
};

// Response types
export interface ProductVariantResponse {
  variantId: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  pricingType: PricingType;
  features: Record<string, string> | null;
  isDefault: boolean;
  displayOrder: number;
  active: boolean;
}

export interface ProductDetailResponse {
  productId: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  type: ProductType;
  status: ProductStatus;
  sellerId: string;
  thumbnailUrl: string | null;
  metadata: Record<string, string> | null;
  accessStrategy: string;
  availableForPurchase: boolean;
  createdAt: string;
  publishedAt: string | null;
  variants: ProductVariantResponse[];
}

export interface ProductResponse {
  productId: string;
  slug: string;
  title: string;
  shortDescription: string;
  type: ProductType;
  status: ProductStatus;
  thumbnailUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
  startingPrice: number | null;
}

export interface ProductAssetResponse {
  assetId: string;
  productId: string;
  variantId: string | null;
  assetType: AssetType;
  storageKey: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// Request types
export interface CreateProductRequest {
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  type: ProductType;
  sellerId: string;
  thumbnailUrl: string;
  metadata: Record<string, string>;
}

export interface UpdateProductRequest {
  title: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  metadata: Record<string, string>;
}

export interface CreateVariantRequest {
  name: string;
  description: string;
  basePrice: number;
  pricingType: PricingType;
  features: Record<string, string>;
  isDefault: boolean;
  displayOrder: number;
}

const ADMIN_API = '/api/v1/admin/products';
const PUBLIC_API = '/api/v1/products';

export const productApi = {
  // Admin: 전체 상품 목록 (DRAFT/ACTIVE/ARCHIVED 포함)
  getAllProducts: async (): Promise<ProductResponse[]> => {
    const response = await apiClient.get(ADMIN_API);
    const data = response.data;
    return data.data || data;
  },

  // Public: ACTIVE 상품 목록
  getActiveProducts: async (type?: ProductType): Promise<ProductResponse[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get(PUBLIC_API, { params });
    const data = response.data;
    return data.data || data;
  },

  // Public: slug로 상품 상세 조회
  getProductBySlug: async (slug: string): Promise<ProductDetailResponse> => {
    const response = await apiClient.get(`${PUBLIC_API}/${slug}`);
    const data = response.data;
    return data.data || data;
  },

  // Admin: 상품 생성
  createProduct: async (request: CreateProductRequest): Promise<ProductDetailResponse> => {
    const response = await apiClient.post(ADMIN_API, request);
    const data = response.data;
    return data.data || data;
  },

  // Admin: 상품 수정
  updateProduct: async (productId: string, request: UpdateProductRequest): Promise<ProductDetailResponse> => {
    const response = await apiClient.put(`${ADMIN_API}/${productId}`, request);
    const data = response.data;
    return data.data || data;
  },

  // Admin: 상태 변경
  changeStatus: async (productId: string, status: ProductStatus): Promise<void> => {
    await apiClient.patch(`${ADMIN_API}/${productId}/status`, { status });
  },

  // Admin: Variant 추가
  addVariant: async (productId: string, request: CreateVariantRequest): Promise<ProductVariantResponse> => {
    const response = await apiClient.post(`${ADMIN_API}/${productId}/variants`, request);
    const data = response.data;
    return data.data || data;
  },

  // Admin: Asset 업로드 (multipart)
  uploadAsset: async (productId: string, file: File, variantId?: string): Promise<ProductAssetResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (variantId) {
      formData.append('variantId', variantId);
    }
    const response = await apiClient.post(`${ADMIN_API}/${productId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    const data = response.data;
    return data.data || data;
  },

  // Admin: Asset 목록
  getAssets: async (productId: string): Promise<ProductAssetResponse[]> => {
    const response = await apiClient.get(`${ADMIN_API}/${productId}/assets`);
    const data = response.data;
    return data.data || data;
  },

  // Admin: Asset 삭제
  deleteAsset: async (productId: string, assetId: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_API}/${productId}/assets/${assetId}`);
  },
};
