import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import RichTextEditor from '../components/editor/RichTextEditor';
import { newslettersApi, type Newsletter, type NewsletterStatus, type SendResult, type SendStats } from '../api/newsletters';
import { newsletterApi, type SubscriberWithStatus } from '../api/newsletter';
import { formatDate } from '../utils/dateUtils';

const NewsletterManagement: React.FC = () => {
  // 구독자 섹션 접기/펼치기 (기본 펼침)
  const [subscribersExpanded, setSubscribersExpanded] = useState(true);

  // 뉴스레터 상태
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [announcements, setAnnouncements] = useState<Array<{text: string; linkUrl?: string; linkText?: string}>>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 구독자 상태
  const [subscribers, setSubscribers] = useState<SubscriberWithStatus[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UNSUBSCRIBED'>('ALL');
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // 테스트 발송 모달
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testNewsletterId, setTestNewsletterId] = useState<number | null>(null);

  // 예약 발송 모달
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleNewsletterId, setScheduleNewsletterId] = useState<number | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  // 발송 이력 모달
  const [showSendResultsModal, setShowSendResultsModal] = useState(false);
  const [sendResultsNewsletterId, setSendResultsNewsletterId] = useState<number | null>(null);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [sendStats, setSendStats] = useState<SendStats | null>(null);
  const [sendResultsLoading, setSendResultsLoading] = useState(false);
  const [sendResultsPage, setSendResultsPage] = useState(0);
  const [sendResultsTotalPages, setSendResultsTotalPages] = useState(0);

  // 미리보기 모달
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  // 구독자 목록은 검색어나 페이지가 변경될 때마다 다시 조회
  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, searchTerm]);

  // 검색어 변경시 페이지를 0으로 리셋 (debounce 효과)
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  // ===== 뉴스레터 관련 함수 =====
  const fetchNewsletters = async () => {
    try {
      setNewslettersLoading(true);
      const data = await newslettersApi.getAll();
      setNewsletters(data);
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setNewslettersLoading(false);
    }
  };

  const handleNew = () => {
    setEditingNewsletter(null);
    setTitle('');
    setContent('');
    setSummary('');
    setAnnouncements([]);
    setActiveView('editor');
  };

  const handleEdit = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setTitle(newsletter.title);

    // content에서 마커 추출
    let rawContent = newsletter.content;

    // Summary 마커 추출
    const summaryMatch = rawContent.match(/<!--SUMMARY:([\s\S]*?)-->/);
    const extractedSummary = summaryMatch ? summaryMatch[1] : '';
    rawContent = rawContent.replace(/<!--SUMMARY:[\s\S]*?-->/, '');

    // Announcements 마커 추출
    const announcementsMatch = rawContent.match(/<!--ANNOUNCEMENTS:([\s\S]*?)-->/);
    const extractedAnnouncements: Array<{text: string; linkUrl?: string; linkText?: string}> = [];
    if (announcementsMatch && announcementsMatch[1]) {
      const items = announcementsMatch[1].split(';;');
      items.forEach(item => {
        if (item.trim()) {
          const parts = item.split('|');
          extractedAnnouncements.push({
            text: parts[0] || '',
            linkUrl: parts[1] || '',
            linkText: parts[2] || '',
          });
        }
      });
    }
    rawContent = rawContent.replace(/<!--ANNOUNCEMENTS:[\s\S]*?-->/, '');

    setContent(rawContent.trim());
    setSummary(extractedSummary);
    setAnnouncements(extractedAnnouncements);
    setActiveView('editor');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      // content에 마커 추가
      let contentWithMarkers = content;

      // Summary 마커 추가
      if (summary.trim()) {
        contentWithMarkers = `<!--SUMMARY:${summary}-->${contentWithMarkers}`;
      }

      // Announcements 마커 추가
      const validAnnouncements = announcements.filter(a => a.text.trim());
      if (validAnnouncements.length > 0) {
        const announcementsStr = validAnnouncements
          .map(a => `${a.text}|${a.linkUrl || ''}|${a.linkText || ''}`)
          .join(';;');
        contentWithMarkers = `${contentWithMarkers}<!--ANNOUNCEMENTS:${announcementsStr}-->`;
      }

      if (editingNewsletter) {
        await newslettersApi.update(editingNewsletter.id, { title, content: contentWithMarkers });
        alert('뉴스레터가 수정되었습니다.');
      } else {
        await newslettersApi.create({ title, content: contentWithMarkers });
        alert('뉴스레터가 생성되었습니다.');
      }
      setActiveView('list');
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await newslettersApi.delete(id);
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const openTestModal = (id: number) => {
    setTestNewsletterId(id);
    setTestEmail('');
    setShowTestModal(true);
  };

  const handleTestSend = async () => {
    if (!testEmail.trim() || !testNewsletterId) return;
    try {
      await newslettersApi.sendTest(testNewsletterId, { email: testEmail });
      alert('테스트 이메일이 발송되었습니다.');
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send test:', error);
      alert('테스트 발송에 실패했습니다.');
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm(`${totalCount}명의 구독자에게 뉴스레터를 발송하시겠습니까?`)) return;
    try {
      await newslettersApi.send(id);
      alert('뉴스레터가 발송되었습니다.');
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to send:', error);
      alert('발송에 실패했습니다.');
    }
  };

  const openScheduleModal = (id: number) => {
    setScheduleNewsletterId(id);
    // 기본값: 내일 오전 9시
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduleDateTime(tomorrow.toISOString().slice(0, 16));
    setShowScheduleModal(true);
  };

  const handleSchedule = async () => {
    if (!scheduleNewsletterId || !scheduleDateTime) return;
    try {
      await newslettersApi.schedule(scheduleNewsletterId, { scheduledAt: scheduleDateTime });
      alert('뉴스레터가 예약되었습니다.');
      setShowScheduleModal(false);
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to schedule:', error);
      alert('예약에 실패했습니다.');
    }
  };

  const handleCancelSchedule = async (id: number) => {
    if (!confirm('예약을 취소하시겠습니까?')) return;
    try {
      await newslettersApi.cancelSchedule(id);
      alert('예약이 취소되었습니다.');
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      alert('예약 취소에 실패했습니다.');
    }
  };

  // ===== 발송 이력 관련 함수 =====
  const openSendResultsModal = async (id: number) => {
    setSendResultsNewsletterId(id);
    setSendResultsPage(0);
    setShowSendResultsModal(true);
    await fetchSendResults(id, 0);
  };

  const fetchSendResults = async (id: number, page: number) => {
    try {
      setSendResultsLoading(true);
      const [resultsData, statsData] = await Promise.all([
        newslettersApi.getSendResults(id, page, 20),
        newslettersApi.getSendStats(id),
      ]);
      setSendResults(resultsData.content);
      setSendResultsTotalPages(resultsData.totalPages);
      setSendStats(statsData);
    } catch (error) {
      console.error('Failed to fetch send results:', error);
      alert('발송 이력 조회에 실패했습니다.');
    } finally {
      setSendResultsLoading(false);
    }
  };

  const handleSendResultsPageChange = (newPage: number) => {
    if (sendResultsNewsletterId) {
      setSendResultsPage(newPage);
      fetchSendResults(sendResultsNewsletterId, newPage);
    }
  };

  // ===== 미리보기 관련 함수 =====
  const handlePreview = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setPreviewLoading(true);
    try {
      // 미리보기 시에도 마커 포함
      let contentWithMarkers = content;

      if (summary.trim()) {
        contentWithMarkers = `<!--SUMMARY:${summary}-->${contentWithMarkers}`;
      }

      const validAnnouncements = announcements.filter(a => a.text.trim());
      if (validAnnouncements.length > 0) {
        const announcementsStr = validAnnouncements
          .map(a => `${a.text}|${a.linkUrl || ''}|${a.linkText || ''}`)
          .join(';;');
        contentWithMarkers = `${contentWithMarkers}<!--ANNOUNCEMENTS:${announcementsStr}-->`;
      }

      const response = await newslettersApi.previewDirect(title, contentWithMarkers);
      setPreviewHtml(response.htmlContent);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to preview:', error);
      alert('미리보기 생성에 실패했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewById = async (id: number) => {
    setPreviewLoading(true);
    try {
      const response = await newslettersApi.preview(id);
      setPreviewHtml(response.htmlContent);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to preview:', error);
      alert('미리보기 생성에 실패했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ===== 구독자 관련 함수 =====
  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const data = await newsletterApi.getAllSubscribers({
        page: currentPage,
        size: pageSize,
        keyword: searchTerm,
      });
      setSubscribers(data.content);
      setTotalCount(data.totalElements);
      setActiveCount(data.activeCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setSubscribersLoading(false);
    }
  };

  // 필터링된 구독자 목록
  const filteredSubscribers = subscribers.filter((s) => {
    return statusFilter === 'ALL' || s.status === statusFilter;
  });

  const copyEmails = () => {
    const emails = filteredSubscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    alert(`${filteredSubscribers.length}개의 이메일이 복사되었습니다.`);
  };

  const handleUnsubscribe = async (email: string) => {
    if (!confirm(`정말 "${email}" 구독을 취소하시겠습니까?`)) return;

    setUnsubscribing(email);
    try {
      await newsletterApi.unsubscribe(email);
      alert('구독이 취소되었습니다.');
      fetchSubscribers();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      alert('구독 취소에 실패했습니다.');
    } finally {
      setUnsubscribing(null);
    }
  };

  const handleReactivate = async (email: string) => {
    if (!confirm(`"${email}" 구독을 재활성화하시겠습니까?`)) return;

    setUnsubscribing(email); // 같은 상태 변수 재사용
    try {
      await newsletterApi.reactivate(email);
      alert('구독이 재활성화되었습니다.');
      fetchSubscribers();
    } catch (error) {
      console.error('Failed to reactivate:', error);
      alert('재활성화에 실패했습니다.');
    } finally {
      setUnsubscribing(null);
    }
  };

  const getStatusBadge = (status: NewsletterStatus) => {
    switch (status) {
      case 'DRAFT':
        return <StatusBadge $status="draft">작성 중</StatusBadge>;
      case 'SCHEDULED':
        return <StatusBadge $status="scheduled">예약됨</StatusBadge>;
      case 'SENT':
        return <StatusBadge $status="sent">발송 완료</StatusBadge>;
    }
  };

  // ===== 렌더링 =====
  return (
    <Container>
      <Header>
        <div>
          <Title>뉴스레터 관리</Title>
          <Description>
            뉴스레터를 작성하고 {totalCount}명의 구독자에게 발송합니다.
          </Description>
        </div>
      </Header>

      {/* 뉴스레터 발송 관리 섹션 */}
      <Section>
          {activeView === 'list' ? (
            <>
              <SectionHeader>
                <SectionTitle>뉴스레터 목록</SectionTitle>
                <AddButton onClick={handleNew}>+ 새 뉴스레터 작성</AddButton>
              </SectionHeader>

              {newslettersLoading ? (
                <LoadingText>로딩 중...</LoadingText>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>호수</Th>
                      <Th>제목</Th>
                      <Th>상태</Th>
                      <Th>발송 대상</Th>
                      <Th>예약/발송일</Th>
                      <Th>액션</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsletters.map((newsletter) => (
                      <tr key={newsletter.id}>
                        <Td>#{newsletter.issueNumber}</Td>
                        <Td>
                          <NewsletterTitle onClick={() => handleEdit(newsletter)}>
                            {newsletter.title}
                          </NewsletterTitle>
                        </Td>
                        <Td>{getStatusBadge(newsletter.status)}</Td>
                        <Td>{newsletter.recipientCount > 0 ? `${newsletter.recipientCount}명` : '-'}</Td>
                        <Td>
                          {newsletter.status === 'SCHEDULED' && newsletter.scheduledAt && (
                            <ScheduleInfo>
                              <ScheduleIcon>⏰</ScheduleIcon>
                              {formatDate(newsletter.scheduledAt)}
                            </ScheduleInfo>
                          )}
                          {newsletter.status === 'SENT' && formatDate(newsletter.sentAt)}
                          {newsletter.status === 'DRAFT' && '-'}
                        </Td>
                        <Td>
                          <ActionButtons>
                            {newsletter.status === 'DRAFT' && (
                              <>
                                <ActionButton onClick={() => handleEdit(newsletter)}>
                                  수정
                                </ActionButton>
                                <ActionButton $preview onClick={() => handlePreviewById(newsletter.id)}>
                                  미리보기
                                </ActionButton>
                                <ActionButton onClick={() => openTestModal(newsletter.id)}>
                                  테스트
                                </ActionButton>
                                <ActionButton $primary onClick={() => handleSend(newsletter.id)}>
                                  즉시 발송
                                </ActionButton>
                                <ActionButton $schedule onClick={() => openScheduleModal(newsletter.id)}>
                                  예약
                                </ActionButton>
                                <ActionButton $danger onClick={() => handleDelete(newsletter.id)}>
                                  삭제
                                </ActionButton>
                              </>
                            )}
                            {newsletter.status === 'SCHEDULED' && (
                              <>
                                <ActionButton onClick={() => handleEdit(newsletter)}>
                                  보기
                                </ActionButton>
                                <ActionButton $preview onClick={() => handlePreviewById(newsletter.id)}>
                                  미리보기
                                </ActionButton>
                                <ActionButton $danger onClick={() => handleCancelSchedule(newsletter.id)}>
                                  예약 취소
                                </ActionButton>
                              </>
                            )}
                            {newsletter.status === 'SENT' && (
                              <>
                                <ActionButton onClick={() => handleEdit(newsletter)}>
                                  보기
                                </ActionButton>
                                <ActionButton $preview onClick={() => handlePreviewById(newsletter.id)}>
                                  미리보기
                                </ActionButton>
                                <ActionButton $history onClick={() => openSendResultsModal(newsletter.id)}>
                                  발송 이력
                                </ActionButton>
                              </>
                            )}
                          </ActionButtons>
                        </Td>
                      </tr>
                    ))}
                    {newsletters.length === 0 && (
                      <tr>
                        <Td colSpan={6}>
                          <EmptyText>작성된 뉴스레터가 없습니다.</EmptyText>
                        </Td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </>
          ) : (
            <EditorContainer>
              <EditorHeader>
                <BackButton onClick={() => setActiveView('list')}>
                  ← 목록으로
                </BackButton>
                <EditorTitle>
                  {editingNewsletter ? `#${editingNewsletter.issueNumber} 수정` : '새 뉴스레터 작성'}
                </EditorTitle>
              </EditorHeader>

              <FormGroup>
                <Label>제목</Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="뉴스레터 제목을 입력하세요"
                  disabled={editingNewsletter?.status === 'SENT'}
                />
              </FormGroup>

              <FormGroup>
                <Label>본문</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="뉴스레터 내용을 작성하세요..."
                  disabled={editingNewsletter?.status === 'SENT'}
                  title={title}
                  summary={summary}
                  onSummaryChange={setSummary}
                  announcements={announcements}
                  onAnnouncementsChange={setAnnouncements}
                />
              </FormGroup>

              {editingNewsletter?.status !== 'SENT' && editingNewsletter?.status !== 'SCHEDULED' && (
                <EditorActions>
                  <SaveButton onClick={handleSave} disabled={isSaving}>
                    {isSaving ? '저장 중...' : '저장'}
                  </SaveButton>
                  <PreviewButton onClick={handlePreview} disabled={previewLoading}>
                    {previewLoading ? '로딩...' : '미리보기'}
                  </PreviewButton>
                  {editingNewsletter && (
                    <>
                      <TestButton onClick={() => openTestModal(editingNewsletter.id)}>
                        테스트 발송
                      </TestButton>
                      <ScheduleButton onClick={() => openScheduleModal(editingNewsletter.id)}>
                        예약 발송
                      </ScheduleButton>
                      <SendButton onClick={() => handleSend(editingNewsletter.id)}>
                        {totalCount}명에게 즉시 발송
                      </SendButton>
                    </>
                  )}
                </EditorActions>
              )}
              {editingNewsletter?.status === 'SCHEDULED' && (
                <EditorActions>
                  <ScheduleInfo style={{ marginRight: 'auto' }}>
                    <ScheduleIcon>⏰</ScheduleIcon>
                    {formatDate(editingNewsletter.scheduledAt)} 예약됨
                  </ScheduleInfo>
                  <CancelScheduleButton onClick={() => handleCancelSchedule(editingNewsletter.id)}>
                    예약 취소
                  </CancelScheduleButton>
                </EditorActions>
              )}
            </EditorContainer>
          )}
      </Section>

      {/* 구독자 관리 섹션 */}
      <Section>
        <CollapsibleHeader onClick={() => setSubscribersExpanded(!subscribersExpanded)}>
          <SectionTitle>구독자 ({totalCount}명)</SectionTitle>
          <ExpandIcon $expanded={subscribersExpanded}>{subscribersExpanded ? '▼' : '▶'}</ExpandIcon>
        </CollapsibleHeader>

        {subscribersExpanded && (
          <>
            <SectionHeader>
              <StatusFilterGroup>
                <StatusFilterButton
                  $active={statusFilter === 'ALL'}
                  onClick={() => setStatusFilter('ALL')}
                >
                  전체 ({totalCount})
                </StatusFilterButton>
                <StatusFilterButton
                  $active={statusFilter === 'ACTIVE'}
                  onClick={() => setStatusFilter('ACTIVE')}
                >
                  활성 ({activeCount})
                </StatusFilterButton>
                <StatusFilterButton
                  $active={statusFilter === 'UNSUBSCRIBED'}
                  onClick={() => setStatusFilter('UNSUBSCRIBED')}
                >
                  해지 ({totalCount - activeCount})
                </StatusFilterButton>
              </StatusFilterGroup>
            <CopyButton onClick={copyEmails} disabled={filteredSubscribers.length === 0}>
              이메일 복사 ({filteredSubscribers.length})
            </CopyButton>
          </SectionHeader>

          <SearchBox>
            <SearchInput
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </SearchBox>

          {subscribersLoading ? (
            <LoadingText>로딩 중...</LoadingText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>이메일</Th>
                  <Th>이름</Th>
                  <Th>상태</Th>
                  <Th>유입 경로</Th>
                  <Th>구독일</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <Td>{subscriber.email}</Td>
                    <Td>{subscriber.name || '-'}</Td>
                    <Td>
                      <SubscriberStatusBadge $status={subscriber.status}>
                        {subscriber.status === 'ACTIVE' ? '활성' : '해지'}
                      </SubscriberStatusBadge>
                    </Td>
                    <Td>
                      <SourceBadge>{subscriber.source || 'direct'}</SourceBadge>
                    </Td>
                    <Td>{formatDate(subscriber.subscribedAt)}</Td>
                    <Td>
                      {subscriber.status === 'ACTIVE' ? (
                        <UnsubscribeButton
                          onClick={() => handleUnsubscribe(subscriber.email)}
                          disabled={unsubscribing === subscriber.email}
                        >
                          {unsubscribing === subscriber.email ? '처리중...' : '구독 취소'}
                        </UnsubscribeButton>
                      ) : (
                        <ReactivateButton
                          onClick={() => handleReactivate(subscriber.email)}
                          disabled={unsubscribing === subscriber.email}
                        >
                          {unsubscribing === subscriber.email ? '처리중...' : '재활성화'}
                        </ReactivateButton>
                      )}
                    </Td>
                  </tr>
                ))}
                {filteredSubscribers.length === 0 && (
                  <tr>
                    <Td colSpan={6}>
                      <EmptyText>
                        {searchTerm ? '검색 결과가 없습니다.' : '구독자가 없습니다.'}
                      </EmptyText>
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                처음
              </PageButton>
              <PageButton
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                이전
              </PageButton>
              <PageInfo>
                {currentPage + 1} / {totalPages} 페이지
              </PageInfo>
              <PageButton
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                다음
              </PageButton>
              <PageButton
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
              >
                마지막
              </PageButton>
            </Pagination>
          )}
          </>
        )}
      </Section>

      {/* 테스트 발송 모달 */}
      {showTestModal && (
        <ModalOverlay onClick={() => setShowTestModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>테스트 발송</ModalTitle>
              <CloseButton onClick={() => setShowTestModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>수신 이메일</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </FormGroup>
              <ModalActions>
                <CancelButton onClick={() => setShowTestModal(false)}>취소</CancelButton>
                <ConfirmButton onClick={handleTestSend}>발송</ConfirmButton>
              </ModalActions>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}

      {/* 예약 발송 모달 */}
      {showScheduleModal && (
        <ModalOverlay onClick={() => setShowScheduleModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>예약 발송</ModalTitle>
              <CloseButton onClick={() => setShowScheduleModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>발송 예약 시간</Label>
                <DateTimeInput
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <ScheduleHint>
                  선택한 시간에 {totalCount}명의 구독자에게 발송됩니다.
                </ScheduleHint>
              </FormGroup>
              <ModalActions>
                <CancelButton onClick={() => setShowScheduleModal(false)}>취소</CancelButton>
                <ScheduleConfirmButton onClick={handleSchedule}>예약하기</ScheduleConfirmButton>
              </ModalActions>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}

      {/* 미리보기 모달 */}
      {showPreviewModal && (
        <ModalOverlay onClick={() => setShowPreviewModal(false)}>
          <PreviewModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>이메일 미리보기</ModalTitle>
              <CloseButton onClick={() => setShowPreviewModal(false)}>×</CloseButton>
            </ModalHeader>
            <PreviewModalBody>
              <PreviewFrame
                srcDoc={previewHtml}
                title="이메일 미리보기"
              />
            </PreviewModalBody>
          </PreviewModal>
        </ModalOverlay>
      )}

      {/* 발송 이력 모달 */}
      {showSendResultsModal && (
        <ModalOverlay onClick={() => setShowSendResultsModal(false)}>
          <SendResultsModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>발송 이력</ModalTitle>
              <CloseButton onClick={() => setShowSendResultsModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {/* 발송 통계 */}
              {sendStats && (
                <StatsContainer>
                  <StatBox>
                    <StatLabel>총 발송</StatLabel>
                    <StatValue>{sendStats.totalCount}건</StatValue>
                  </StatBox>
                  <StatBox $success>
                    <StatLabel>성공</StatLabel>
                    <StatValue>{sendStats.sentCount}건</StatValue>
                  </StatBox>
                  <StatBox $failure>
                    <StatLabel>실패</StatLabel>
                    <StatValue>{sendStats.failedCount}건</StatValue>
                  </StatBox>
                  <StatBox>
                    <StatLabel>성공률</StatLabel>
                    <StatValue>{sendStats.successRate}%</StatValue>
                  </StatBox>
                </StatsContainer>
              )}

              {/* 발송 결과 테이블 */}
              {sendResultsLoading ? (
                <LoadingText>로딩 중...</LoadingText>
              ) : (
                <SendResultsTable>
                  <thead>
                    <tr>
                      <Th>이메일</Th>
                      <Th>상태</Th>
                      <Th>테스트</Th>
                      <Th>처리 시간</Th>
                      <Th>오류</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sendResults.map((result) => (
                      <tr key={result.id}>
                        <Td>{result.email}</Td>
                        <Td>
                          <SendStatusBadge $status={result.status}>
                            {result.status === 'SENT' ? '성공' : result.status === 'FAILED' ? '실패' : result.status === 'SCHEDULED' ? '예약됨' : '취소됨'}
                          </SendStatusBadge>
                        </Td>
                        <Td>{result.isTest ? '예' : '-'}</Td>
                        <Td>{formatDate(result.processedAt)}</Td>
                        <Td>
                          {result.errorMessage ? (
                            <ErrorMessage title={result.errorMessage}>
                              {result.errorMessage.substring(0, 30)}...
                            </ErrorMessage>
                          ) : (
                            '-'
                          )}
                        </Td>
                      </tr>
                    ))}
                    {sendResults.length === 0 && (
                      <tr>
                        <Td colSpan={5}>
                          <EmptyText>발송 이력이 없습니다.</EmptyText>
                        </Td>
                      </tr>
                    )}
                  </tbody>
                </SendResultsTable>
              )}

              {/* 페이지네이션 */}
              {sendResultsTotalPages > 1 && (
                <Pagination>
                  <PageButton
                    onClick={() => handleSendResultsPageChange(0)}
                    disabled={sendResultsPage === 0}
                  >
                    처음
                  </PageButton>
                  <PageButton
                    onClick={() => handleSendResultsPageChange(sendResultsPage - 1)}
                    disabled={sendResultsPage === 0}
                  >
                    이전
                  </PageButton>
                  <PageInfo>
                    {sendResultsPage + 1} / {sendResultsTotalPages} 페이지
                  </PageInfo>
                  <PageButton
                    onClick={() => handleSendResultsPageChange(sendResultsPage + 1)}
                    disabled={sendResultsPage >= sendResultsTotalPages - 1}
                  >
                    다음
                  </PageButton>
                  <PageButton
                    onClick={() => handleSendResultsPageChange(sendResultsTotalPages - 1)}
                    disabled={sendResultsPage >= sendResultsTotalPages - 1}
                  >
                    마지막
                  </PageButton>
                </Pagination>
              )}
            </ModalBody>
          </SendResultsModal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default NewsletterManagement;

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

const Description = styled.p`
  color: #666;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const CollapsibleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background 0.2s;

  &:hover {
    background: #e9ecef;
  }
`;

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  font-size: 12px;
  color: #6b7280;
  transition: transform 0.2s;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const AddButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #4338ca;
  }
`;

const CopyButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const SearchBox = styled.div`
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
`;

const NewsletterTitle = styled.span`
  color: #4f46e5;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span<{ $status: 'draft' | 'scheduled' | 'sent' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  ${({ $status }) => {
    switch ($status) {
      case 'draft':
        return 'background: #fef3c7; color: #92400e;';
      case 'scheduled':
        return 'background: #dbeafe; color: #1e40af;';
      case 'sent':
        return 'background: #d1fae5; color: #065f46;';
    }
  }}
`;

const SourceBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const StatusFilterGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const StatusFilterButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${({ $active }) => ($active ? '#4f46e5' : '#d1d5db')};
  background: ${({ $active }) => ($active ? '#4f46e5' : 'white')};
  color: ${({ $active }) => ($active ? 'white' : '#374151')};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4f46e5;
  }
`;

const SubscriberStatusBadge = styled.span<{ $status: 'ACTIVE' | 'UNSUBSCRIBED' }>`
  display: inline-block;
  padding: 4px 8px;
  background: ${({ $status }) => ($status === 'ACTIVE' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $status }) => ($status === 'ACTIVE' ? '#16a34a' : '#dc2626')};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $primary?: boolean; $danger?: boolean; $schedule?: boolean; $history?: boolean; $preview?: boolean }>`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background: white;
  color: #374151;
  transition: all 0.2s;

  ${({ $primary }) =>
    $primary &&
    `
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;

    &:hover {
      background: #4338ca;
    }
  `}

  ${({ $danger }) =>
    $danger &&
    `
    color: #dc2626;
    border-color: #fecaca;

    &:hover {
      background: #fee2e2;
    }
  `}

  ${({ $schedule }) =>
    $schedule &&
    `
    background: #059669;
    border-color: #059669;
    color: white;

    &:hover {
      background: #047857;
    }
  `}

  ${({ $history }) =>
    $history &&
    `
    background: #0284c7;
    border-color: #0284c7;
    color: white;

    &:hover {
      background: #0369a1;
    }
  `}

  ${({ $preview }) =>
    $preview &&
    `
    background: #7c3aed;
    border-color: #7c3aed;
    color: white;

    &:hover {
      background: #6d28d9;
    }
  `}

  &:hover {
    background: #f3f4f6;
  }
`;

const ScheduleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #1e40af;
  font-size: 13px;
`;

const ScheduleIcon = styled.span`
  font-size: 14px;
`;

const UnsubscribeButton = styled.button`
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReactivateButton = styled.button`
  padding: 6px 12px;
  background: #dcfce7;
  color: #16a34a;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #bbf7d0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 20px;
`;

// Editor styles
const EditorContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #374151;
  }
`;

const EditorTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const EditorActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const TestButton = styled.button`
  padding: 12px 24px;
  background: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #eef2ff;
  }
`;

const PreviewButton = styled.button`
  padding: 12px 24px;
  background: white;
  color: #0284c7;
  border: 1px solid #0284c7;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #e0f2fe;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }
`;

const ScheduleButton = styled.button`
  padding: 12px 24px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #047857;
  }
`;

const CancelScheduleButton = styled.button`
  padding: 12px 24px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #fecaca;
  }
`;

// Modal styles
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

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;

  &:hover {
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }
`;

const DateTimeInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
  }
`;

const ScheduleHint = styled.p`
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
`;

const ScheduleConfirmButton = styled.button`
  padding: 10px 20px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #047857;
  }
`;

// 페이지네이션 스타일
const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px 0;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

// 발송 이력 모달 스타일
const SendResultsModal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  ${ModalBody} {
    flex: 1;
    overflow-y: auto;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatBox = styled.div<{ $success?: boolean; $failure?: boolean }>`
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;

  ${({ $success }) =>
    $success &&
    `
    background: #d1fae5;
  `}

  ${({ $failure }) =>
    $failure &&
    `
    background: #fee2e2;
  `}
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
`;

const SendResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  th, td {
    font-size: 13px;
  }
`;

const SendStatusBadge = styled.span<{ $status: 'SENT' | 'FAILED' | 'SCHEDULED' | 'CANCELLED' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  ${({ $status }) => {
    switch ($status) {
      case 'SENT':
        return 'background: #d1fae5; color: #065f46;';
      case 'FAILED':
        return 'background: #fee2e2; color: #dc2626;';
      case 'SCHEDULED':
        return 'background: #dbeafe; color: #1e40af;';
      case 'CANCELLED':
        return 'background: #f3f4f6; color: #6b7280;';
    }
  }}
`;

const ErrorMessage = styled.span`
  color: #dc2626;
  font-size: 12px;
  cursor: help;
`;

// 미리보기 모달 스타일
const PreviewModal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const PreviewModalBody = styled.div`
  flex: 1;
  padding: 16px;
  overflow: auto;
  background: #f8f9fa;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 65vh;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
`;
