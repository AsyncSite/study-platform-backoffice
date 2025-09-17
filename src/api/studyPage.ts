import apiClient from './client';

// Study Page Types
export interface PageTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  borderRadius?: string;
  spacing?: string;
  darkMode?: boolean;
  maxWidth?: string;
  containerPadding?: string;
  customCss?: string;
}

export interface PageSection {
  id: string;
  type: typeof SectionType[keyof typeof SectionType];
  props: any;
  order: number;
}

export const SectionType = {
  RICH_TEXT: 'RICH_TEXT',
  HERO: 'HERO',
  GALLERY: 'GALLERY',
  MEMBERS: 'MEMBERS',
  FAQ: 'FAQ',
  REVIEWS: 'REVIEWS',
  VIDEO_EMBED: 'VIDEO_EMBED',
  TABS: 'TABS',
  ACCORDION: 'ACCORDION',
  STATS: 'STATS',
  TABLE: 'TABLE',
  CUSTOM_HTML: 'CUSTOM_HTML',
  CODE_BLOCK: 'CODE_BLOCK',
  HOW_WE_ROLL: 'HOW_WE_ROLL',
  JOURNEY: 'JOURNEY',
  EXPERIENCE: 'EXPERIENCE',
  LEADER_INTRO: 'LEADER_INTRO'
}

const SectionTypeToLabel: Record<string, string> = {
  [SectionType.HERO]: '메인 배너',
  [SectionType.LEADER_INTRO]: '리더 소개',
  [SectionType.RICH_TEXT]: '텍스트 섹션',
  [SectionType.MEMBERS]: '멤버',
  [SectionType.FAQ]: '자주 묻는 질문',
  [SectionType.REVIEWS]: '후기',
  [SectionType.HOW_WE_ROLL]: '우리의 방식',
  [SectionType.JOURNEY]: '여정',
  [SectionType.EXPERIENCE]: '경험',
  [SectionType.GALLERY]: '갤러리',
  [SectionType.VIDEO_EMBED]: '동영상',
  [SectionType.TABS]: '탭',
  [SectionType.ACCORDION]: '접이식 메뉴',
  [SectionType.STATS]: '통계',
  [SectionType.TABLE]: '표',
  [SectionType.CUSTOM_HTML]: '사용자 정의 HTML',
  [SectionType.CODE_BLOCK]: '코드 블록'
};

export const convertSectionTypeToLabel = (sectionType: string) => {
  return SectionTypeToLabel[sectionType];
};

export const PageStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
} as const;

export interface StudyDetailPageData {
  id: string;
  studyId: string;
  slug: string;
  status: typeof PageStatus[keyof typeof PageStatus];
  theme: PageTheme;
  sections: PageSection[];
  schemaVersion: string;
  version: number;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CreatePageRequest {
  slug: string;
}

export interface UpdatePageRequest {
  theme?: PageTheme;
  sections: PageSection[];
}

export interface AddSectionRequest {
  type: typeof SectionType[keyof typeof SectionType];
  props: any;
  order?: number;  // Optional: 지정하지 않으면 백엔드에서 자동으로 맨 뒤에 추가
}

// Version Management Types
export interface PageVersion {
  id: string;
  studyDetailPageId: string;
  versionNumber: number;
  versionType: typeof PageStatus[keyof typeof PageStatus];
  slug: string;
  theme?: PageTheme;
  sections: PageSection[];
  checksum: string;
  parentVersionId?: string;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface PageEditLock {
  id: string;
  studyDetailPageId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
  lockType: typeof PageStatus[keyof typeof PageStatus];
  reason?: string;
  isValid: boolean;
  remainingSeconds: number;
}

export interface VersionHistoryPage {
  content: VersionHistoryEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface VersionHistoryEntry {
  id: string;
  studyDetailPageId: string;
  versionId: string;
  actionType: typeof PageStatus[keyof typeof PageStatus];
  performedBy: string;
  performedAt: string;
  changesSummary?: string;
}

export interface VersionComparison {
  fromVersionId: string;
  toVersionId: string;
  fromVersionNumber: number;
  toVersionNumber: number;
  changes: VersionChange[];
  summary: VersionComparisonSummary;
}

export interface VersionChange {
  type: typeof PageStatus[keyof typeof PageStatus];
  sectionId?: string;
  field?: string;
  description: string;
}

export interface VersionComparisonSummary {
  totalChanges: number;
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsModified: number;
  sectionsReordered: number;
  themeChanged: boolean;
  summaryText: string;
}

// API path
const STUDY_PAGES_API_PATH = '/api/study-pages';

export const studyPageApi = {
  // Public endpoints
  getPublishedPageBySlug: async (slug: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/slug/${slug}`);
    return response.data;
  },

  // Authenticated endpoints
  getDraftPage: async (studyId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/${studyId}/draft`);
    return response.data;
  },

  // 상태와 무관하게 페이지 조회 (편집 페이지용)
  getPageForEditing: async (studyId: string, studySlug: string): Promise<StudyDetailPageData | null> => {
    // 편집 페이지는 항상 draft를 우선으로 표시해야 함!
    // 1. draft 페이지 먼저 시도 (편집 중인 내용)
    try {
      const draftPage = await studyPageApi.getDraftPage(studyId);
      if (draftPage) {
        return draftPage;
      }
    } catch (error) {
      // draft가 없음 - published를 시도
    }
    
    // 2. draft가 없으면 published 페이지 시도
    try {
      const publishedPage = await studyPageApi.getPublishedPageBySlug(studySlug);
      if (publishedPage && publishedPage.studyId === studyId) {
        return publishedPage;
      }
    } catch (error) {
      // published도 없음
    }
    
    // 3. 둘 다 없으면 null
    return null;
  },

  createPage: async (studyId: string, request: CreatePageRequest): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}`, request);
    return response.data;
  },

  saveDraft: async (studyId: string, request: UpdatePageRequest): Promise<StudyDetailPageData> => {
    const response = await apiClient.put(`${STUDY_PAGES_API_PATH}/${studyId}/draft`, request);
    return response.data;
  },

  addSection: async (studyId: string, request: AddSectionRequest): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/sections`, request);
    return response.data;
  },

  removeSection: async (studyId: string, sectionId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.delete(`${STUDY_PAGES_API_PATH}/${studyId}/sections/${sectionId}`);
    return response.data;
  },

  updateSection: async (studyId: string, sectionId: string, request: AddSectionRequest): Promise<StudyDetailPageData> => {
    const response = await apiClient.put(`${STUDY_PAGES_API_PATH}/${studyId}/sections/${sectionId}`, request);
    return response.data;
  },

  reorderSections: async (studyId: string, sectionIds: string[]): Promise<StudyDetailPageData> => {
    const response = await apiClient.put(`${STUDY_PAGES_API_PATH}/${studyId}/sections/reorder`, { sectionIds });
    return response.data;
  },

  requestReview: async (studyId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/request-review`);
    return response.data;
  },

  rejectReview: async (studyId: string, reason?: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/reject-review`, null, {
      params: { reason }
    });
    return response.data;
  },

  publish: async (studyId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/publish`);
    return response.data;
  },

  archive: async (studyId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/archive`);
    return response.data;
  },

  // ============== Version Management APIs ==============
  
  // Create page with version management
  createPageWithVersion: async (studyId: string, request: CreatePageRequest): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/create-with-version`, request);
    return response.data;
  },

  // Get or create draft version
  getOrCreateDraftVersion: async (studyId: string): Promise<PageVersion> => {
    const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/${studyId}/draft-version`);
    return response.data;
  },

  // Save draft version
  saveDraftVersion: async (studyId: string, request: UpdatePageRequest): Promise<PageVersion> => {
    const response = await apiClient.put(`${STUDY_PAGES_API_PATH}/${studyId}/draft-version`, request);
    return response.data;
  },

  // Publish draft to live
  publishDraft: async (studyId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/publish`);
    return response.data;
  },

  // Discard draft changes
  discardDraft: async (studyId: string): Promise<void> => {
    await apiClient.delete(`${STUDY_PAGES_API_PATH}/${studyId}/draft-version`);
  },

  // Get version history - updated to match consolidated backend API
  getVersionHistory: async (pageId: string): Promise<any[]> => {
    const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/${pageId}/versions/history`);
    return response.data;
  },

  // Revert to a previous version
  revertToVersion: async (pageId: string, versionId: string): Promise<StudyDetailPageData> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${pageId}/versions/revert/${versionId}`);
    return response.data;
  },

  // Compare versions (keeping for future use)
  compareVersions: async (studyId: string, fromVersion: number, toVersion: number): Promise<VersionComparison> => {
    const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/${studyId}/diff`, {
      params: { fromVersion, toVersion }
    });
    return response.data;
  },

  // ============== Lock Management APIs ==============

  // Acquire edit lock
  acquireLock: async (studyId: string, reason?: string): Promise<PageEditLock> => {
    const response = await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/lock`, { reason });
    return response.data;
  },

  // Release edit lock
  releaseLock: async (studyId: string): Promise<void> => {
    await apiClient.delete(`${STUDY_PAGES_API_PATH}/${studyId}/lock`);
  },

  // Extend lock
  extendLock: async (studyId: string, minutes: number = 5): Promise<PageEditLock> => {
    const response = await apiClient.put(`${STUDY_PAGES_API_PATH}/${studyId}/lock/extend`, null, {
      params: { minutes }
    });
    return response.data;
  },

  // Send heartbeat for lock
  sendLockHeartbeat: async (studyId: string): Promise<void> => {
    await apiClient.post(`${STUDY_PAGES_API_PATH}/${studyId}/lock/heartbeat`);
  },

  // Get current lock status
  getLockStatus: async (studyId: string): Promise<PageEditLock | null> => {
    try {
      const response = await apiClient.get(`${STUDY_PAGES_API_PATH}/${studyId}/lock`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Force release lock (admin only)
  forceReleaseLock: async (studyId: string): Promise<void> => {
    await apiClient.delete(`${STUDY_PAGES_API_PATH}/${studyId}/lock/force`);
  }
};
