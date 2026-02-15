import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  resumeApi,
} from '../api/resume';
import type {
  ResumeTemplate,
  ResumeRequest,
  Resume,
  ResumeRequestStatus,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../api/resume';

type SubTab = 'requests' | 'converter' | 'resumes' | 'templates';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  GENERATED: '#10b981',
  DELIVERED: '#3b82f6',
  ARCHIVED: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  GENERATED: '생성됨',
  DELIVERED: '전달됨',
  ARCHIVED: '보관됨',
};

const ResumeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('requests');

  // Requests state
  const [requests, setRequests] = useState<ResumeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState<ResumeRequestStatus | ''>('');

  // Converter state
  const [htmlInput, setHtmlInput] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | undefined>();

  // Resumes state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<CreateTemplateRequest>({ name: '', description: '', promptText: '' });

  // Auto generation state
  const [autoGenerationEnabled, setAutoGenerationEnabled] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState<number | null>(null);

  // Request-Resume linking state
  const [expandedRequestResumeIds, setExpandedRequestResumeIds] = useState<Set<number>>(new Set());
  const [resumesByRequestIdMap, setResumesByRequestIdMap] = useState<Record<number, Resume[]>>({});
  const [resumeStatusChanging, setResumeStatusChanging] = useState<number | null>(null);

  // Fetch functions
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = requestStatusFilter
        ? await resumeApi.getRequests(requestStatusFilter as ResumeRequestStatus)
        : await resumeApi.getRequests();
      setRequests(data);
    } catch (error) {
      console.error('요청 목록 조회 실패:', error);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestStatusFilter]);

  const fetchResumes = useCallback(async () => {
    setResumesLoading(true);
    try {
      const data = await resumeApi.getResumes();
      setResumes(data);
    } catch (error) {
      console.error('이력서 목록 조회 실패:', error);
    } finally {
      setResumesLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await resumeApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('템플릿 목록 조회 실패:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'resumes') {
      fetchResumes();
      fetchRequests(); // needed for requester name mapping
    }
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, fetchRequests, fetchResumes, fetchTemplates]);

  useEffect(() => {
    resumeApi.getAutoGenerationSetting()
      .then(data => setAutoGenerationEnabled(data.enabled))
      .catch(err => console.error('자동 생성 설정 조회 실패:', err));
  }, []);

  // Handlers
  const handleCopyFormattedText = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  const handleChangeRequestStatus = async (id: number, status: ResumeRequestStatus) => {
    try {
      await resumeApi.changeRequestStatus(id, status);
      fetchRequests();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await resumeApi.deleteRequest(id);
      fetchRequests();
    } catch (error) {
      console.error('요청 삭제 실패:', error);
    }
  };

  const handlePreview = () => {
    if (!htmlInput.trim()) {
      alert('HTML을 입력해주세요.');
      return;
    }
    setPreviewHtml(htmlInput);
    setShowPreview(true);
  };

  const handleGeneratePdf = async () => {
    if (!htmlInput.trim()) {
      alert('HTML을 입력해주세요.');
      return;
    }
    if (!pdfTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    setGenerating(true);
    try {
      await resumeApi.generateResume({
        requestId: selectedRequestId,
        title: pdfTitle,
        htmlContent: htmlInput,
        mode: 'MANUAL',
      });
      alert('PDF가 생성되었습니다.');
      setHtmlInput('');
      setPdfTitle('');
      setShowPreview(false);
      setSelectedRequestId(undefined);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? R2의 PDF 파일도 삭제됩니다.')) return;
    try {
      await resumeApi.deleteResume(id);
      fetchResumes();
    } catch (error) {
      console.error('이력서 삭제 실패:', error);
    }
  };

  const handleDownloadResume = (pdfUrl: string | null) => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  // Template handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', promptText: '' });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: ResumeTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({ name: template.name, description: template.description || '', promptText: template.promptText });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.promptText.trim()) {
      alert('이름과 프롬프트 텍스트는 필수입니다.');
      return;
    }
    try {
      if (editingTemplate) {
        await resumeApi.updateTemplate(editingTemplate.id, templateForm as UpdateTemplateRequest);
      } else {
        await resumeApi.createTemplate(templateForm);
      }
      setShowTemplateModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await resumeApi.deleteTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
    }
  };

  const handleToggleAutoGeneration = async (enabled: boolean) => {
    try {
      const result = await resumeApi.setAutoGenerationSetting(enabled);
      setAutoGenerationEnabled(result.enabled);
    } catch (error) {
      console.error('자동 생성 설정 변경 실패:', error);
      alert('설정 변경에 실패했습니다.');
    }
  };

  const handleToggleRequestResumes = async (requestId: number) => {
    const newExpanded = new Set(expandedRequestResumeIds);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
      setExpandedRequestResumeIds(newExpanded);
      return;
    }
    newExpanded.add(requestId);
    setExpandedRequestResumeIds(newExpanded);
    try {
      const data = await resumeApi.getResumesByRequestId(requestId);
      setResumesByRequestIdMap((prev) => ({ ...prev, [requestId]: data }));
    } catch (error) {
      console.error('요청별 이력서 조회 실패:', error);
      setResumesByRequestIdMap((prev) => ({ ...prev, [requestId]: [] }));
    }
  };

  const handleMarkDelivered = async (resumeId: number) => {
    if (!confirm('이 이력서를 전달 완료로 변경하시겠습니까?')) return;
    setResumeStatusChanging(resumeId);
    try {
      await resumeApi.changeResumeStatus(resumeId, 'DELIVERED');
      fetchResumes();
      // Refresh expanded request resume data
      for (const requestId of expandedRequestResumeIds) {
        const data = await resumeApi.getResumesByRequestId(requestId);
        setResumesByRequestIdMap((prev) => ({ ...prev, [requestId]: data }));
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setResumeStatusChanging(null);
    }
  };

  const handleAutoGenerate = async (requestId: number) => {
    if (!confirm('AI로 이력서를 자동 생성하시겠습니까?')) return;
    setAutoGenLoading(requestId);
    try {
      await resumeApi.autoGenerate(requestId);
      alert('이력서가 자동 생성되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('자동 생성 실패:', error);
      alert('자동 생성에 실패했습니다.');
    } finally {
      setAutoGenLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Container>
      <Header>
        <h1>이력서 관리</h1>
        <SettingRow>
          <SettingLabel>AI 자동 생성</SettingLabel>
          <ToggleSwitch
            checked={autoGenerationEnabled}
            onChange={(e) => handleToggleAutoGeneration(e.target.checked)}
          />
        </SettingRow>
      </Header>

      <SubTabNav>
        <SubTabButton $active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>이력서 요청</SubTabButton>
        <SubTabButton $active={activeTab === 'converter'} onClick={() => setActiveTab('converter')}>PDF 변환기</SubTabButton>
        <SubTabButton $active={activeTab === 'resumes'} onClick={() => setActiveTab('resumes')}>생성된 이력서</SubTabButton>
        <SubTabButton $active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>프롬프트 템플릿</SubTabButton>
      </SubTabNav>

      {/* 이력서 요청 탭 */}
      {activeTab === 'requests' && (
        <Section>
          <SectionHeader>
            <h2>이력서 요청 목록</h2>
            <FilterRow>
              <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value as ResumeRequestStatus | '')}>
                <option value="">전체</option>
                <option value="PENDING">대기중</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="COMPLETED">완료</option>
                <option value="CANCELLED">취소</option>
              </select>
            </FilterRow>
          </SectionHeader>

          {requestsLoading ? (
            <LoadingText>로딩 중...</LoadingText>
          ) : requests.length === 0 ? (
            <EmptyText>이력서 요청이 없습니다.</EmptyText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th>생성일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <React.Fragment key={req.id}>
                  <tr>
                    <td>{req.id}</td>
                    <td>{req.userName}</td>
                    <td>{req.userEmail || '-'}</td>
                    <td><StatusBadge $color={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</StatusBadge></td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td>
                      <ActionRow>
                        <SmallButton onClick={() => handleCopyFormattedText(req.formattedText)} disabled={!req.formattedText}>복사</SmallButton>
                        {req.status === 'PENDING' && (
                          <SmallButton
                            onClick={() => handleAutoGenerate(req.id)}
                            disabled={autoGenLoading === req.id}
                            style={{ background: '#8b5cf6', color: 'white' }}
                          >
                            {autoGenLoading === req.id ? '생성중...' : 'AI 생성'}
                          </SmallButton>
                        )}
                        {req.status === 'COMPLETED' && (
                          <SmallButton
                            onClick={() => handleToggleRequestResumes(req.id)}
                            style={{ background: '#10b981', color: 'white' }}
                          >
                            {expandedRequestResumeIds.has(req.id) ? '접기' : '이력서 보기'}
                          </SmallButton>
                        )}
                        <select
                          value={req.status}
                          onChange={(e) => handleChangeRequestStatus(req.id, e.target.value as ResumeRequestStatus)}
                        >
                          <option value="PENDING">대기중</option>
                          <option value="IN_PROGRESS">진행중</option>
                          <option value="COMPLETED">완료</option>
                          <option value="CANCELLED">취소</option>
                        </select>
                        <SmallButton $variant="danger" onClick={() => handleDeleteRequest(req.id)}>삭제</SmallButton>
                      </ActionRow>
                    </td>
                  </tr>
                  {expandedRequestResumeIds.has(req.id) && (
                    <tr>
                      <td colSpan={6} style={{ padding: '12px 16px', background: '#f9fafb' }}>
                        {resumesByRequestIdMap[req.id] === undefined ? (
                          <span>로딩 중...</span>
                        ) : resumesByRequestIdMap[req.id].length === 0 ? (
                          <span style={{ color: '#9ca3af' }}>생성된 이력서가 없습니다.</span>
                        ) : (
                          resumesByRequestIdMap[req.id].map((resume) => (
                            <div key={resume.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 500 }}>{resume.title}</span>
                              <StatusBadge $color={STATUS_COLORS[resume.status]}>{STATUS_LABELS[resume.status]}</StatusBadge>
                              <SmallButton onClick={() => handleDownloadResume(resume.pdfUrl)} disabled={!resume.pdfUrl}>다운로드</SmallButton>
                              {resume.status === 'GENERATED' && (
                                <SmallButton
                                  onClick={() => handleMarkDelivered(resume.id)}
                                  disabled={resumeStatusChanging === resume.id}
                                  style={{ background: '#3b82f6', color: 'white' }}
                                >
                                  {resumeStatusChanging === resume.id ? '변경중...' : '전달 완료'}
                                </SmallButton>
                              )}
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                ))}
              </tbody>
            </Table>
          )}
        </Section>
      )}

      {/* PDF 변환기 탭 */}
      {activeTab === 'converter' && (
        <Section>
          <SectionHeader>
            <h2>HTML → PDF 변환기</h2>
          </SectionHeader>

          <FormGroup>
            <label>제목</label>
            <Input
              type="text"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
              placeholder="이력서 제목을 입력하세요"
            />
          </FormGroup>

          <FormGroup>
            <label>연결할 요청 ID (선택사항)</label>
            <Input
              type="number"
              value={selectedRequestId || ''}
              onChange={(e) => setSelectedRequestId(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="요청 ID"
            />
          </FormGroup>

          <FormGroup>
            <label>HTML 코드</label>
            <TextArea
              rows={20}
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="이력서 HTML 코드를 붙여넣으세요..."
            />
          </FormGroup>

          <ButtonRow>
            <ActionButton onClick={handlePreview}>프리뷰</ActionButton>
            <ActionButton $primary onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'PDF 생성 중...' : 'PDF 생성'}
            </ActionButton>
          </ButtonRow>

          {showPreview && (
            <PreviewContainer>
              <h3>프리뷰</h3>
              <PreviewFrame srcDoc={previewHtml} title="Resume Preview" />
            </PreviewContainer>
          )}
        </Section>
      )}

      {/* 생성된 이력서 탭 */}
      {activeTab === 'resumes' && (
        <Section>
          <SectionHeader>
            <h2>생성된 이력서</h2>
            <SmallButton onClick={fetchResumes}>새로고침</SmallButton>
          </SectionHeader>

          {resumesLoading ? (
            <LoadingText>로딩 중...</LoadingText>
          ) : resumes.length === 0 ? (
            <EmptyText>생성된 이력서가 없습니다.</EmptyText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>제목</th>
                  <th>요청자</th>
                  <th>모드</th>
                  <th>파일 크기</th>
                  <th>상태</th>
                  <th>생성일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => {
                  const matchedRequest = resume.requestId
                    ? requests.find((r) => r.id === resume.requestId)
                    : undefined;
                  return (
                  <tr key={resume.id}>
                    <td>{resume.id}</td>
                    <td>{resume.title}</td>
                    <td>{matchedRequest ? matchedRequest.userName : '-'}</td>
                    <td>{resume.generationMode}</td>
                    <td>{formatFileSize(resume.fileSizeBytes)}</td>
                    <td><StatusBadge $color={STATUS_COLORS[resume.status]}>{STATUS_LABELS[resume.status]}</StatusBadge></td>
                    <td>{formatDate(resume.createdAt)}</td>
                    <td>
                      <ActionRow>
                        <SmallButton onClick={() => handleDownloadResume(resume.pdfUrl)} disabled={!resume.pdfUrl}>다운로드</SmallButton>
                        {resume.status === 'GENERATED' && (
                          <SmallButton
                            onClick={() => handleMarkDelivered(resume.id)}
                            disabled={resumeStatusChanging === resume.id}
                            style={{ background: '#3b82f6', color: 'white' }}
                          >
                            {resumeStatusChanging === resume.id ? '변경중...' : '전달 완료'}
                          </SmallButton>
                        )}
                        <SmallButton $variant="danger" onClick={() => handleDeleteResume(resume.id)}>삭제</SmallButton>
                      </ActionRow>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Section>
      )}

      {/* 프롬프트 템플릿 탭 */}
      {activeTab === 'templates' && (
        <Section>
          <SectionHeader>
            <h2>프롬프트 템플릿</h2>
            <ActionButton $primary onClick={handleCreateTemplate}>새 템플릿 추가</ActionButton>
          </SectionHeader>

          {templatesLoading ? (
            <LoadingText>로딩 중...</LoadingText>
          ) : templates.length === 0 ? (
            <EmptyText>등록된 템플릿이 없습니다.</EmptyText>
          ) : (
            <TemplateGrid>
              {templates.map((template) => (
                <TemplateCard key={template.id}>
                  <TemplateCardHeader>
                    <h3>{template.name}</h3>
                    <StatusBadge $color={template.active ? '#10b981' : '#6b7280'}>
                      {template.active ? '활성' : '비활성'}
                    </StatusBadge>
                  </TemplateCardHeader>
                  {template.description && <p>{template.description}</p>}
                  <TemplatePromptPreview>{template.promptText.substring(0, 200)}...</TemplatePromptPreview>
                  <TemplateCardFooter>
                    <span>{formatDate(template.createdAt)}</span>
                    <ActionRow>
                      <SmallButton onClick={() => handleEditTemplate(template)}>수정</SmallButton>
                      <SmallButton $variant="danger" onClick={() => handleDeleteTemplate(template.id)}>삭제</SmallButton>
                    </ActionRow>
                  </TemplateCardFooter>
                </TemplateCard>
              ))}
            </TemplateGrid>
          )}
        </Section>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <ModalOverlay onClick={() => setShowTemplateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{editingTemplate ? '템플릿 수정' : '새 템플릿 추가'}</h2>
            <FormGroup>
              <label>이름</label>
              <Input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="템플릿 이름"
              />
            </FormGroup>
            <FormGroup>
              <label>설명</label>
              <Input
                type="text"
                value={templateForm.description || ''}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="템플릿 설명 (선택사항)"
              />
            </FormGroup>
            <FormGroup>
              <label>프롬프트 텍스트</label>
              <TextArea
                rows={15}
                value={templateForm.promptText}
                onChange={(e) => setTemplateForm({ ...templateForm, promptText: e.target.value })}
                placeholder="프롬프트 텍스트를 입력하세요..."
              />
            </FormGroup>
            <ButtonRow>
              <ActionButton onClick={() => setShowTemplateModal(false)}>취소</ActionButton>
              <ActionButton $primary onClick={handleSaveTemplate}>저장</ActionButton>
            </ButtonRow>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// Styled Components

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SettingLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 44px;
  height: 24px;
  background: ${({ theme }) => theme.colors.gray[300]};
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:checked {
    background: ${({ theme }) => theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: ${({ theme }) => theme.transitions.normal};
  }

  &:checked::before {
    transform: translateX(20px);
  }
`;

const SubTabNav = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
  padding-bottom: 0;
`;

const SubTabButton = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.gray[500])};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  margin-bottom: -2px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;

  select {
    padding: 6px 12px;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radii.medium};
    font-size: 13px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
    font-size: 13px;
  }

  th {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray[600]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  tr:hover td {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: ${({ $color }) => $color};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  select {
    padding: 4px 8px;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radii.small};
    font-size: 12px;
  }
`;

const SmallButton = styled.button<{ $variant?: 'danger' }>`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.small};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  background: ${({ $variant, theme }) =>
    $variant === 'danger' ? theme.colors.error : theme.colors.gray[100]};
  color: ${({ $variant, theme }) =>
    $variant === 'danger' ? 'white' : theme.colors.text.primary};
  border: none;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  background: ${({ $primary, theme }) =>
    $primary ? theme.colors.primary : theme.colors.gray[100]};
  color: ${({ $primary, theme }) =>
    $primary ? 'white' : theme.colors.text.primary};
  border: none;

  &:hover:not(:disabled) {
    opacity: 0.85;
    box-shadow: ${({ theme }) => theme.shadows.small};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 24px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 800px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.medium};
  background: white;
`;

const LoadingText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding: 40px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  padding: 40px;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
`;

const TemplateCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 20px;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.gray[500]};
    margin-bottom: 12px;
  }
`;

const TemplateCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const TemplatePromptPreview = styled.pre`
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[600]};
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const TemplateCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radii.xlarge};
  padding: 32px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.large};

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export default ResumeManagement;
