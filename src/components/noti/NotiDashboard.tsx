import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, RefreshCw, Send, CheckCircle, XCircle, Clock, Filter, Eye } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { notiApi, type NotificationResponse, type NotificationSearchCriteria, type NotificationStatus, type ChannelType } from '../../api/noti';
import Button from '../common/Button';

const NotiDashboard: React.FC = () => {
  const { showToast } = useNotification();

  // State
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Statistics - 전체 통계를 위한 별도 state
  const [totalStats, setTotalStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    scheduled: 0
  });

  // Search criteria
  const [searchCriteria, setSearchCriteria] = useState<NotificationSearchCriteria>({});

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<NotificationResponse | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [tempCriteria, setTempCriteria] = useState<NotificationSearchCriteria>({});

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchTotalStats();
  }, [currentPage]);

  const fetchNotifications = async (isSearch = false, criteria = searchCriteria) => {
    try {
      setLoading(true);
      let response: any;

      if (isSearch && Object.keys(criteria).some(key => criteria[key as keyof NotificationSearchCriteria])) {
        response = await notiApi.searchNotifications(criteria, currentPage, 20);
      } else {
        response = await notiApi.getAllNotifications(currentPage, 20);
      }

      if (response.success && response.data) {
        setNotifications(response.data.content);
        setTotalElements(response.data.totalElements);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      showToast(error.message || '알림 목록 조회에 실패했습니다.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 전체 통계를 가져오는 별도 함수
  const fetchTotalStats = async () => {
    try {
      // 백엔드 통계 API 사용 - 단일 쿼리로 효율적으로 집계
      const response = await notiApi.getNotificationStats();

      if (response.success && response.data) {
        const newStats = {
          total: response.data.total,
          sent: response.data.sent,
          failed: response.data.failed,
          pending: response.data.pending,
          scheduled: response.data.scheduled
        };
        setTotalStats(newStats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setSearchCriteria(tempCriteria);
    setCurrentPage(0);
    fetchNotifications(true, tempCriteria);
    setShowFilters(false);
  };

  const handleReset = () => {
    setSearchCriteria({});
    setTempCriteria({});
    setCurrentPage(0);
    fetchNotifications(false);
  };

  const handleRetry = async (notificationId: string) => {
    try {
      const response = await notiApi.retryNotification(notificationId);
      if (response.success) {
        showToast('알림 재발송 요청이 성공했습니다.', { type: 'success' });
        fetchNotifications();
      }
    } catch (error: any) {
      showToast(error.message || '재발송에 실패했습니다.', { type: 'error' });
    }
  };

  const handleCancel = async (notificationId: string) => {
    if (!confirm('예약된 알림을 취소하시겠습니까?')) {
      return;
    }

    try {
      const response = await notiApi.cancelNotification(notificationId);
      if (response.success) {
        showToast('예약 알림이 취소되었습니다.', { type: 'success' });
        fetchNotifications();
        fetchTotalStats();
      }
    } catch (error: any) {
      showToast(error.message || '알림 취소에 실패했습니다.', { type: 'error' });
    }
  };

  const handlePreview = async (notification: NotificationResponse) => {
    // 이메일 채널인 경우에만 미리보기 제공
    if (notification.channelType !== 'EMAIL') {
      showToast('이메일 알림만 미리보기를 지원합니다.', { type: 'info' });
      return;
    }

    setPreviewNotification(notification);
    setShowPreviewModal(true);

    // 초기화
    setPreviewContent('');

    try {
      // 백엔드에서 렌더링된 HTML 가져오기
      const response = await notiApi.getNotificationPreview(notification.notificationId);
      if (response.success && response.data) {
        setPreviewContent(response.data.htmlContent);
      } else {
        console.error('Preview response not successful:', response);
        showToast('미리보기 데이터를 가져올 수 없습니다.', { type: 'error' });
        setPreviewContent('<div style="padding: 20px; text-align: center; color: #666;">미리보기를 생성할 수 없습니다.</div>');
      }
    } catch (error: any) {
      // 실패 시 에러 로깅 및 사용자 알림
      console.error('Failed to fetch preview:', error);
      showToast('미리보기 로드 중 오류가 발생했습니다.', { type: 'error' });
      setPreviewContent('<div style="padding: 20px; text-align: center; color: #666;">미리보기를 불러올 수 없습니다.<br/>오류: ' + (error.message || 'Unknown error') + '</div>');
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    const config = {
      SENT: { color: '#10b981', icon: CheckCircle, label: '발송완료' },
      FAILED: { color: '#ef4444', icon: XCircle, label: '실패' },
      PENDING: { color: '#f59e0b', icon: Clock, label: '대기중' },
      SCHEDULED: { color: '#6366f1', icon: Clock, label: '예약' },
      CANCELLED: { color: '#6b7280', icon: XCircle, label: '취소됨' }
    };

    const { color, icon: Icon, label } = config[status] || config.PENDING;

    return (
      <StatusBadge $color={color}>
        <Icon size={14} />
        <span>{label}</span>
      </StatusBadge>
    );
  };

  const getChannelBadge = (channel: ChannelType) => {
    const config = {
      EMAIL: { color: '#3b82f6', label: '이메일' },
      DISCORD: { color: '#5865f2', label: '디스코드' },
      PUSH: { color: '#8b5cf6', label: '푸시' }
    };

    const { color, label } = config[channel] || { color: '#6b7280', label: channel };

    return <ChannelBadge $color={color}>{label}</ChannelBadge>;
  };

  // UTC를 KST로 변환하는 헬퍼 함수
  const utcToKst = (utcDateStr: string) => {
    const utcDate = new Date(utcDateStr);
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
    return kstDate;
  };

  // KST 포맷팅 함수
  const formatKstDate = (dateStr: string) => {
    const kstDate = utcToKst(dateStr);
    return kstDate.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getNotificationDate = (notification: NotificationResponse) => {
    // 상태에 따라 적절한 날짜 선택
    if (notification.status === 'SCHEDULED' && notification.scheduledAt) {
      return {
        date: notification.scheduledAt,
        label: '예약',
        color: '#6366f1'
      };
    } else if (notification.status === 'SENT' && notification.sentAt) {
      return {
        date: notification.sentAt,
        label: '발송',
        color: '#10b981'
      };
    } else {
      return {
        date: notification.createdAt,
        label: '생성',
        color: '#6b7280'
      };
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <Container>
        <LoadingWrapper>
          <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px' }} />
          <LoadingText>로딩 중...</LoadingText>
        </LoadingWrapper>
      </Container>
    );
  }

  return (
    <Container>
      {/* Statistics Cards */}
      <StatsGrid>
        <StatCard>
          <StatIcon $color="#6366f1">
            <Send size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>전체 발송</StatLabel>
            <StatValue>{totalStats.total.toLocaleString()}</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#10b981">
            <CheckCircle size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>발송 성공</StatLabel>
            <StatValue>{totalStats.sent}</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#ef4444">
            <XCircle size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>발송 실패</StatLabel>
            <StatValue>{totalStats.failed}</StatValue>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#f59e0b">
            <Clock size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>대기/예약</StatLabel>
            <StatValue>{totalStats.pending + totalStats.scheduled}</StatValue>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Actions Bar */}
      <ActionsBar>
        <SearchSection>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            검색 필터
          </Button>
          {Object.keys(searchCriteria).some(key => searchCriteria[key as keyof NotificationSearchCriteria]) && (
            <Button variant="text" onClick={handleReset}>
              필터 초기화
            </Button>
          )}
        </SearchSection>
        <Button
          variant="text"
          onClick={() => fetchNotifications()}
        >
          <RefreshCw size={16} />
          새로고침
        </Button>
      </ActionsBar>

      {/* Search Filters */}
      {showFilters && (
        <FiltersPanel>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>사용자 ID</FilterLabel>
              <FilterInput
                placeholder="사용자 ID 입력"
                value={tempCriteria.userId || ''}
                onChange={(e) => setTempCriteria({ ...tempCriteria, userId: e.target.value })}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>상태</FilterLabel>
              <FilterSelect
                value={tempCriteria.statuses || ''}
                onChange={(e) => setTempCriteria({ ...tempCriteria, statuses: e.target.value })}
              >
                <option value="">전체</option>
                <option value="SENT">발송완료</option>
                <option value="FAILED">실패</option>
                <option value="PENDING">대기중</option>
                <option value="SCHEDULED">예약</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>채널</FilterLabel>
              <FilterSelect
                value={tempCriteria.channelTypes || ''}
                onChange={(e) => setTempCriteria({ ...tempCriteria, channelTypes: e.target.value })}
              >
                <option value="">전체</option>
                <option value="EMAIL">이메일</option>
                <option value="DISCORD">디스코드</option>
                <option value="PUSH">푸시</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>키워드</FilterLabel>
              <FilterInput
                placeholder="제목/내용 검색"
                value={tempCriteria.keyword || ''}
                onChange={(e) => setTempCriteria({ ...tempCriteria, keyword: e.target.value })}
              />
            </FilterGroup>
          </FilterGrid>
          <FilterActions>
            <Button variant="primary" onClick={handleSearch}>
              <Search size={16} />
              검색
            </Button>
            <Button variant="secondary" onClick={() => setShowFilters(false)}>
              닫기
            </Button>
          </FilterActions>
        </FiltersPanel>
      )}

      {/* Notifications Table */}
      <TableSection>
        <Table>
          <thead>
            <tr>
              <Th>일시 (KST)</Th>
              <Th>사용자</Th>
              <Th>채널</Th>
              <Th>제목</Th>
              <Th>상태</Th>
              <Th>재시도</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => {
              const dateInfo = getNotificationDate(notification);
              return (
                <Tr key={notification.notificationId}>
                  <Td>
                    <DateWrapper>
                      <DateLabel $color={dateInfo.color}>{dateInfo.label}</DateLabel>
                      <DateText>{formatKstDate(dateInfo.date)}</DateText>
                    </DateWrapper>
                  </Td>
                <Td>{notification.userId || 'Guest'}</Td>
                <Td>{getChannelBadge(notification.channelType)}</Td>
                <Td>
                  <TitleCell title={notification.title}>
                    {notification.title}
                  </TitleCell>
                </Td>
                <Td>{getStatusBadge(notification.status)}</Td>
                <Td>{notification.retryCount}</Td>
                <Td>
                  <ActionButtons>
                    {notification.channelType === 'EMAIL' && (
                      <PreviewButton onClick={() => handlePreview(notification)}>
                        <Eye size={14} />
                        미리보기
                      </PreviewButton>
                    )}
                    {notification.status === 'FAILED' && (
                      <ActionButton onClick={() => handleRetry(notification.notificationId)}>
                        재발송
                      </ActionButton>
                    )}
                    {notification.status === 'SCHEDULED' && (
                      <CancelButton onClick={() => handleCancel(notification.notificationId)}>
                        취소
                      </CancelButton>
                    )}
                  </ActionButtons>
                </Td>
              </Tr>
              );
            })}
          </tbody>
        </Table>

        {notifications.length === 0 && (
          <EmptyState>
            <p>조건에 맞는 알림이 없습니다.</p>
          </EmptyState>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PageInfo>
              {currentPage + 1} / {totalPages} 페이지 (총 {totalElements}개)
            </PageInfo>
            <PageButtons>
              <Button
                variant="text"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                처음
              </Button>
              <Button
                variant="text"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                이전
              </Button>
              <Button
                variant="text"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                다음
              </Button>
              <Button
                variant="text"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
              >
                마지막
              </Button>
            </PageButtons>
          </Pagination>
        )}
      </TableSection>

      {/* Email Preview Modal */}
      {showPreviewModal && previewNotification && (
        <PreviewModal>
          <PreviewModalOverlay onClick={() => setShowPreviewModal(false)} />
          <PreviewModalContent>
            <PreviewModalHeader>
              <h2>이메일 미리보기</h2>
              <CloseButton onClick={() => setShowPreviewModal(false)}>✕</CloseButton>
            </PreviewModalHeader>
            <PreviewModalBody>
              <PreviewInfo>
                <InfoRow>
                  <InfoLabel>수신자:</InfoLabel>
                  <InfoValue>{previewNotification.userId || 'Guest'}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>제목:</InfoLabel>
                  <InfoValue>{previewNotification.title}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>템플릿:</InfoLabel>
                  <InfoValue>{previewNotification.templateId}</InfoValue>
                </InfoRow>
              </PreviewInfo>
              <PreviewDivider />
              <PreviewFrame>
                {previewContent ? (
                  <iframe
                    srcDoc={previewContent}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Email Preview"
                  />
                ) : (
                  <LoadingWrapper>
                    <RefreshCw className="animate-spin" />
                    <LoadingText>미리보기 로딩 중...</LoadingText>
                  </LoadingWrapper>
                )}
              </PreviewFrame>
            </PreviewModalBody>
          </PreviewModalContent>
        </PreviewModal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  width: 100%;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingText = styled.span`
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const FiltersPanel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const TableSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tr = styled.tr`
  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TitleCell = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DateLabel = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DateText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.primary};
`;


const StatusBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
  font-weight: 500;
`;

const ChannelBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
  font-weight: 500;
`;

const ActionButton = styled.button`
  padding: 4px 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

const CancelButton = styled.button`
  padding: 4px 12px;
  background: ${({ theme }) => theme.colors.error || '#ef4444'};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 16px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const PageInfo = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const PageButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PreviewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: #2563eb;
  }
`;

// Preview Modal Styles
const PreviewModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const PreviewModalContent = styled.div`
  position: relative;
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: white;
  border-radius: ${({ theme }) => theme.radii.large};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PreviewModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const PreviewModalBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewInfo = styled.div`
  padding: 16px 24px;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-right: 8px;
  min-width: 80px;
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PreviewDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.gray[200]};
`;

const PreviewFrame = styled.div`
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

export default NotiDashboard;