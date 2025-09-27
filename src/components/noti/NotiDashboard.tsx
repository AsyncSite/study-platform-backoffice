import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, RefreshCw, Send, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { notiApi, type NotificationResponse, type NotificationSearchCriteria, type NotificationStatus, type ChannelType } from '../../api/noti';
import type { PageResponse } from '../../types/api';
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
  const [tempCriteria, setTempCriteria] = useState<NotificationSearchCriteria>({});

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchTotalStats();
  }, [currentPage]);

  const fetchNotifications = async (isSearch = false) => {
    try {
      setLoading(true);
      let response: any;

      if (isSearch && Object.keys(searchCriteria).some(key => searchCriteria[key as keyof NotificationSearchCriteria])) {
        response = await notiApi.searchNotifications(searchCriteria, currentPage, 20);
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
      // 전체 데이터를 가져와서 통계 계산 (첫 100개만 샘플링)
      const response = await notiApi.getAllNotifications(0, 100);

      if (response.success && response.data) {
        const allData = response.data.content;
        const newStats = {
          total: response.data.totalElements, // 전체 개수 사용
          sent: allData.filter((n: NotificationResponse) => n.status === 'SENT').length,
          failed: allData.filter((n: NotificationResponse) => n.status === 'FAILED').length,
          pending: allData.filter((n: NotificationResponse) => n.status === 'PENDING').length,
          scheduled: allData.filter((n: NotificationResponse) => n.status === 'SCHEDULED').length
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
    fetchNotifications(true);
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
              <Th>발송일시</Th>
              <Th>사용자</Th>
              <Th>채널</Th>
              <Th>제목</Th>
              <Th>상태</Th>
              <Th>재시도</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <Tr key={notification.notificationId}>
                <Td>{new Date(notification.createdAt).toLocaleString('ko-KR')}</Td>
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
                  {notification.status === 'FAILED' && (
                    <ActionButton onClick={() => handleRetry(notification.notificationId)}>
                      재발송
                    </ActionButton>
                  )}
                </Td>
              </Tr>
            ))}
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

export default NotiDashboard;