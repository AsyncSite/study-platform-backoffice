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

type MainTab = 'workflow' | 'templates';
type WorkflowStep = 1 | 2 | 3;

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
  const [activeTab, setActiveTab] = useState<MainTab>('workflow');
  const [activeStep, setActiveStep] = useState<WorkflowStep>(1);

  // Requests state
  const [requests, setRequests] = useState<ResumeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState<ResumeRequestStatus | ''>('');
  const [selectedRequest, setSelectedRequest] = useState<ResumeRequest | null>(null);

  // Step 2 state
  const [htmlInput, setHtmlInput] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);

  // Step 3 state
  const [requestResumes, setRequestResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumeStatusChanging, setResumeStatusChanging] = useState<number | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<CreateTemplateRequest>({ name: '', description: '', promptText: '' });

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

  const fetchRequestResumes = useCallback(async (requestId: number) => {
    setResumesLoading(true);
    try {
      const data = await resumeApi.getResumesByRequestId(requestId);
      setRequestResumes(data);
    } catch (error) {
      console.error('요청별 이력서 조회 실패:', error);
      setRequestResumes([]);
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
    if (activeTab === 'workflow') {
      fetchRequests();
    }
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, fetchRequests, fetchTemplates]);

  useEffect(() => {
    if (selectedRequest) {
      fetchRequestResumes(selectedRequest.id);
    }
  }, [selectedRequest, fetchRequestResumes]);

  // Handlers
  const handleSelectRequest = (req: ResumeRequest) => {
    setSelectedRequest(req);
    // 상태에 따라 적절한 Step으로 이동
    if (req.status === 'COMPLETED') {
      setActiveStep(3); // 완료 → 결과 확인
    } else if (req.status === 'CANCELLED') {
      setActiveStep(1); // 취소 → 원본만 확인
    } else if (req.status === 'IN_PROGRESS') {
      setActiveStep(2); // 진행중 → 첨삭 작성
    } else {
      setActiveStep(1); // 대기중 → 원본 확인
    }
    // Reset step 2 inputs
    setHtmlInput('');
    setPdfTitle('');
    setShowPreview(false);
  };

  const handleCopyFormattedText = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await resumeApi.deleteRequest(id);
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
      fetchRequests();
    } catch (error) {
      console.error('요청 삭제 실패:', error);
    }
  };

  const handleGoToStep2 = async () => {
    if (!selectedRequest) return;
    // PENDING → IN_PROGRESS 자동 전환
    if (selectedRequest.status === 'PENDING') {
      try {
        await resumeApi.changeRequestStatus(selectedRequest.id, 'IN_PROGRESS');
        await fetchRequests();
        const updated = (await resumeApi.getRequests()).find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      } catch (error) {
        console.error('상태 변경 실패:', error);
      }
    }
    setActiveStep(2);
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    if (!confirm('이 요청을 취소하시겠습니까?')) return;
    try {
      await resumeApi.changeRequestStatus(selectedRequest.id, 'CANCELLED');
      await fetchRequests();
      const updated = (await resumeApi.getRequests()).find(r => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
    } catch (error) {
      console.error('취소 실패:', error);
      alert('취소에 실패했습니다.');
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedRequest) return;
    if (!confirm('AI로 이력서를 자동 생성하시겠습니까? (약 30~60초 소요)')) return;
    setAutoGenLoading(true);
    try {
      // 백엔드가 자동으로 PENDING→IN_PROGRESS→COMPLETED 상태 전환 처리
      await resumeApi.autoGenerate(selectedRequest.id);
      alert('이력서가 자동 생성되었습니다.');
      await fetchRequests();
      const updated = (await resumeApi.getRequests()).find(r => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
      await fetchRequestResumes(selectedRequest.id);
      setActiveStep(3);
    } catch (error) {
      console.error('자동 생성 실패:', error);
      alert('자동 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAutoGenLoading(false);
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
    if (!selectedRequest) {
      alert('요청을 선택해주세요.');
      return;
    }
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
        requestId: selectedRequest.id,
        title: pdfTitle,
        htmlContent: htmlInput,
        mode: 'MANUAL',
      });
      // 자동 상태 전환: → COMPLETED
      await resumeApi.changeRequestStatus(selectedRequest.id, 'COMPLETED');
      alert('PDF가 생성되었습니다.');
      setHtmlInput('');
      setPdfTitle('');
      setShowPreview(false);
      await fetchRequests();
      const updated = (await resumeApi.getRequests()).find(r => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
      await fetchRequestResumes(selectedRequest.id);
      setActiveStep(3);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadResume = (pdfUrl: string | null) => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  const handleMarkDelivered = async (resumeId: number) => {
    if (!selectedRequest) return;
    if (!confirm('이 이력서를 전달 완료로 변경하시겠습니까?')) return;
    setResumeStatusChanging(resumeId);
    try {
      await resumeApi.changeResumeStatus(resumeId, 'DELIVERED');
      await fetchRequestResumes(selectedRequest.id);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setResumeStatusChanging(null);
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!selectedRequest) return;
    if (!confirm('정말 삭제하시겠습니까? R2의 PDF 파일도 삭제됩니다.')) return;
    try {
      await resumeApi.deleteResume(id);
      await fetchRequestResumes(selectedRequest.id);
    } catch (error) {
      console.error('이력서 삭제 실패:', error);
    }
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

  const handleToggleTemplateActive = async (id: number) => {
    try {
      await resumeApi.toggleTemplateActive(id);
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 활성 상태 변경 실패:', error);
      alert('활성 상태 변경에 실패했습니다.');
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

  const parseInputData = (inputData: string | null): { type: 'PDF_UPLOAD'; pdfUrl: string } | { type: 'FORM'; data: string } | null => {
    if (!inputData) return null;
    try {
      const parsed = JSON.parse(inputData);
      if (parsed.type === 'PDF_UPLOAD' && parsed.pdfUrl) {
        return { type: 'PDF_UPLOAD', pdfUrl: parsed.pdfUrl };
      }
    } catch {
      // not JSON, treat as form data
    }
    return { type: 'FORM', data: inputData };
  };

  const filteredRequests = requests;

  return (
    <Container>
      <Header>
        <h1>이력서 관리</h1>
      </Header>

      <TabNav>
        <TabButton $active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')}>첨삭 워크플로우</TabButton>
        <TabButton $active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>프롬프트 템플릿</TabButton>
      </TabNav>

      {/* 첨삭 워크플로우 탭 */}
      {activeTab === 'workflow' && (
        <WorkflowContainer>
          {/* Left Panel: Request List */}
          <RequestListPanel>
            <PanelHeader>
              <h2>요청 목록</h2>
              <FilterSelect value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value as ResumeRequestStatus | '')}>
                <option value="">전체</option>
                <option value="PENDING">대기중</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="COMPLETED">완료</option>
                <option value="CANCELLED">취소</option>
              </FilterSelect>
            </PanelHeader>

            {requestsLoading ? (
              <LoadingText>로딩 중...</LoadingText>
            ) : filteredRequests.length === 0 ? (
              <EmptyText>이력서 요청이 없습니다.</EmptyText>
            ) : (
              <RequestCardList>
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    $active={selectedRequest?.id === req.id}
                    onClick={() => handleSelectRequest(req)}
                  >
                    <RequestCardHeader>
                      <RequestId>#{req.id}</RequestId>
                      <StatusBadge $color={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</StatusBadge>
                    </RequestCardHeader>
                    <RequestUserName>{req.userName}</RequestUserName>
                    <RequestUserEmail>{req.userEmail || '-'}</RequestUserEmail>
                    <RequestDate>{formatDate(req.createdAt)}</RequestDate>
                  </RequestCard>
                ))}
              </RequestCardList>
            )}
          </RequestListPanel>

          {/* Right Panel: Workflow Steps */}
          <WorkflowPanel>
            {!selectedRequest ? (
              <PlaceholderMessage>
                <p>왼쪽에서 요청을 선택하세요</p>
              </PlaceholderMessage>
            ) : (
              <>
                {/* Step Indicator */}
                {(() => {
                  const isFinished = selectedRequest?.status === 'COMPLETED' || selectedRequest?.status === 'CANCELLED';
                  return (
                    <>
                      <StepIndicator>
                        <StepCircle $active={activeStep === 1} onClick={() => setActiveStep(1)}>
                          <StepNumber $active={activeStep === 1}>1</StepNumber>
                        </StepCircle>
                        <StepLine />
                        <StepCircle $active={activeStep === 2} onClick={() => !isFinished && handleGoToStep2()} style={isFinished ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                          <StepNumber $active={activeStep === 2}>2</StepNumber>
                        </StepCircle>
                        <StepLine />
                        <StepCircle $active={activeStep === 3} onClick={() => setActiveStep(3)}>
                          <StepNumber $active={activeStep === 3}>3</StepNumber>
                        </StepCircle>
                      </StepIndicator>

                      <StepLabels>
                        <StepLabel $active={activeStep === 1} onClick={() => setActiveStep(1)}>원본 확인</StepLabel>
                        <StepLabel $active={activeStep === 2} onClick={() => !isFinished && handleGoToStep2()} style={isFinished ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>첨삭 작성</StepLabel>
                        <StepLabel $active={activeStep === 3} onClick={() => setActiveStep(3)}>결과 확인/전달</StepLabel>
                      </StepLabels>
                    </>
                  );
                })()}

                {/* Step 1: 원본 확인 */}
                {activeStep === 1 && (
                  <StepContent>
                    <StepTitle>Step 1: 원본 확인</StepTitle>

                    <StepSection>
                      <SectionLabel>유저 제출 내용</SectionLabel>
                      {(() => {
                        const parsed = parseInputData(selectedRequest.inputData);
                        if (!parsed) return <EmptyText>제출 데이터 없음</EmptyText>;
                        if (parsed.type === 'PDF_UPLOAD') {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>PDF 업로드</span>
                              <ActionButton onClick={() => window.open(parsed.pdfUrl, '_blank')} style={{ background: '#f59e0b', color: 'white' }}>
                                원본 PDF 다운로드
                              </ActionButton>
                            </div>
                          );
                        }
                        return (
                          <div>
                            {selectedRequest.formattedText ? (
                              <DataPreview>
                                {selectedRequest.formattedText}
                              </DataPreview>
                            ) : (
                              <DataPreview>
                                {parsed.data}
                              </DataPreview>
                            )}
                            <ActionButton onClick={() => handleCopyFormattedText(selectedRequest.formattedText || parsed.data)}>
                              복사
                            </ActionButton>
                          </div>
                        );
                      })()}
                    </StepSection>

                    <StepSection>
                      <ActionRow>
                        {selectedRequest.status === 'COMPLETED' ? (
                          <ActionButton $primary onClick={() => setActiveStep(3)}>
                            결과 확인하기 &rarr;
                          </ActionButton>
                        ) : selectedRequest.status === 'CANCELLED' ? (
                          <StatusBadge $color="#ef4444" style={{ fontSize: '14px', padding: '6px 16px' }}>취소된 요청</StatusBadge>
                        ) : (
                          <ActionButton $primary onClick={() => handleGoToStep2()}>
                            첨삭 시작하기 &rarr;
                          </ActionButton>
                        )}
                        {selectedRequest.status !== 'CANCELLED' && selectedRequest.status !== 'COMPLETED' && (
                          <ActionButton onClick={handleCancelRequest} style={{ background: '#fef2f2', color: '#ef4444' }}>
                            요청 취소
                          </ActionButton>
                        )}
                        <ActionButton $variant="danger" onClick={() => handleDeleteRequest(selectedRequest.id)}>
                          삭제
                        </ActionButton>
                      </ActionRow>
                    </StepSection>
                  </StepContent>
                )}

                {/* Step 2: 첨삭 작성 */}
                {activeStep === 2 && (
                  <StepContent>
                    <StepTitle>Step 2: 첨삭 작성</StepTitle>

                    <StepSection>
                      <SectionLabel>AI 자동 생성</SectionLabel>
                      <ActionButton
                        $primary
                        onClick={handleAutoGenerate}
                        disabled={autoGenLoading}
                        style={{ width: 'fit-content' }}
                      >
                        {autoGenLoading ? 'AI 생성 중...' : 'AI 자동 생성'}
                      </ActionButton>
                    </StepSection>

                    <Divider>또는</Divider>

                    <StepSection>
                      <SectionLabel>수동 작성</SectionLabel>
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
                        <label>HTML 코드</label>
                        <TextArea
                          rows={25}
                          value={htmlInput}
                          onChange={(e) => setHtmlInput(e.target.value)}
                          placeholder="이력서 HTML 코드를 붙여넣으세요..."
                          style={{ fontFamily: 'monospace', fontSize: '12px' }}
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
                    </StepSection>
                  </StepContent>
                )}

                {/* Step 3: 결과 확인/전달 */}
                {activeStep === 3 && (
                  <StepContent>
                    <StepTitle>Step 3: 결과 확인/전달</StepTitle>

                    <StepSection>
                      <SectionLabel>생성된 이력서</SectionLabel>
                      {resumesLoading ? (
                        <LoadingText>로딩 중...</LoadingText>
                      ) : requestResumes.length === 0 ? (
                        <EmptyText>생성된 이력서가 없습니다.</EmptyText>
                      ) : (
                        <ResumeList>
                          {requestResumes.map((resume) => (
                            <ResumeItem key={resume.id}>
                              <ResumeInfo>
                                <ResumeTitle>{resume.title}</ResumeTitle>
                                <ResumeMetadata>
                                  <StatusBadge $color={STATUS_COLORS[resume.status]}>
                                    {STATUS_LABELS[resume.status]}
                                  </StatusBadge>
                                  <span>{formatFileSize(resume.fileSizeBytes)}</span>
                                  <span>{formatDate(resume.createdAt)}</span>
                                </ResumeMetadata>
                              </ResumeInfo>
                              <ResumeActions>
                                <ActionButton onClick={() => handleDownloadResume(resume.pdfUrl)} disabled={!resume.pdfUrl}>
                                  다운로드
                                </ActionButton>
                                {resume.status === 'GENERATED' && (
                                  <ActionButton
                                    onClick={() => handleMarkDelivered(resume.id)}
                                    disabled={resumeStatusChanging === resume.id}
                                    style={{ background: '#3b82f6', color: 'white' }}
                                  >
                                    {resumeStatusChanging === resume.id ? '변경중...' : '전달 완료'}
                                  </ActionButton>
                                )}
                                <ActionButton $variant="danger" onClick={() => handleDeleteResume(resume.id)}>
                                  삭제
                                </ActionButton>
                              </ResumeActions>
                            </ResumeItem>
                          ))}
                        </ResumeList>
                      )}
                    </StepSection>
                  </StepContent>
                )}
              </>
            )}
          </WorkflowPanel>
        </WorkflowContainer>
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
                      <SmallButton onClick={() => handleToggleTemplateActive(template.id)}>
                        {template.active ? '비활성화' : '활성화'}
                      </SmallButton>
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

const TabNav = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
  padding-bottom: 0;
`;

const TabButton = styled.button<{ $active: boolean }>`
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

const WorkflowContainer = styled.div`
  display: flex;
  gap: 24px;
  height: calc(100vh - 200px);
`;

const RequestListPanel = styled.div`
  width: 320px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  overflow-y: auto;
  flex-shrink: 0;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
`;

const RequestCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RequestCard = styled.div<{ $active: boolean }>`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.medium};
  border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.gray[200])};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary + '10' : 'white')};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const RequestCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const RequestId = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const RequestUserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const RequestUserEmail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 6px;
`;

const RequestDate = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const WorkflowPanel = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  overflow-y: auto;
`;

const PlaceholderMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  p {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const StepCircle = styled.div<{ $active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.gray[200])};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    opacity: 0.8;
  }
`;

const StepNumber = styled.span<{ $active: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? 'white' : '#6b7280')};
`;

const StepLine = styled.div`
  width: 80px;
  height: 2px;
  background: ${({ theme }) => theme.colors.gray[300]};
`;

const StepLabels = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 32px;
`;

const StepLabel = styled.div<{ $active: boolean }>`
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.gray[500])};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const StepContent = styled.div``;

const StepTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 24px;
`;

const StepSection = styled.div`
  margin-bottom: 24px;
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const DataPreview = styled.pre`
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
  margin-bottom: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  select {
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radii.medium};
    font-size: 14px;
  }
`;

const Divider = styled.div`
  text-align: center;
  margin: 24px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: calc(50% - 40px);
    height: 1px;
    background: ${({ theme }) => theme.colors.gray[300]};
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
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

const ActionButton = styled.button<{ $primary?: boolean; $variant?: 'danger' }>`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  background: ${({ $primary, $variant, theme }) =>
    $variant === 'danger' ? theme.colors.error : $primary ? theme.colors.primary : theme.colors.gray[100]};
  color: ${({ $primary, $variant }) => ($primary || $variant === 'danger' ? 'white' : '#374151')};
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
  height: 900px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.medium};
  background: white;
`;

const ResumeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResumeItem = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radii.medium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.small};
  }
`;

const ResumeInfo = styled.div`
  flex: 1;
`;

const ResumeTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const ResumeMetadata = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ResumeActions = styled.div`
  display: flex;
  gap: 8px;
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
