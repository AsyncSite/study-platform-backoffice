import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { newsletterApi, type SubscriberWithStatus } from '../api/newsletter';
import { newslettersApi, type Newsletter } from '../api/newsletters';
import { formatDate } from '../utils/dateUtils';

const SubscriberManagement: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberWithStatus[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UNSUBSCRIBED'>('ALL');

  // 선택 발송 관련 state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<number | null>(null);
  const [sendingToSubscribers, setSendingToSubscribers] = useState(false);
  const [sendTargetId, setSendTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const data = await newsletterApi.getAllSubscribers({ size: 100 });
      setSubscribers(data.content);
      setTotalCount(data.totalElements);
      setActiveCount(data.activeCount);
      setUnsubscribedCount(data.unsubscribedCount);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
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

    setUnsubscribing(email);
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

  // 체크박스 토글
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const activeSubscribers = filteredSubscribers.filter((s) => s.status === 'ACTIVE');
    if (selectedIds.size === activeSubscribers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeSubscribers.map((s) => s.id)));
    }
  };

  // 뉴스레터 목록 조회
  const fetchNewsletters = async () => {
    try {
      const data = await newslettersApi.getAll();
      setNewsletters(data);
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    }
  };

  // 선택 발송 모달 열기
  const openSendModal = (subscriberId?: number) => {
    if (subscriberId) {
      setSendTargetId(subscriberId);
    } else {
      setSendTargetId(null);
    }
    fetchNewsletters();
    setShowNewsletterModal(true);
    setSelectedNewsletterId(null);
  };

  // 선택 발송 실행
  const handleSendToSubscribers = async () => {
    if (!selectedNewsletterId) {
      alert('발송할 뉴스레터를 선택해주세요.');
      return;
    }

    const targetIds = sendTargetId ? [sendTargetId] : Array.from(selectedIds);
    if (targetIds.length === 0) {
      alert('발송 대상을 선택해주세요.');
      return;
    }

    if (!confirm(`${targetIds.length}명에게 뉴스레터를 발송하시겠습니까?`)) return;

    setSendingToSubscribers(true);
    try {
      await newslettersApi.sendToSubscribers(selectedNewsletterId, targetIds);
      alert(`${targetIds.length}명에게 발송되었습니다.`);
      setShowNewsletterModal(false);
      setSelectedIds(new Set());
      setSendTargetId(null);
    } catch (error) {
      console.error('Failed to send newsletter:', error);
      alert('발송에 실패했습니다.');
    } finally {
      setSendingToSubscribers(false);
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>뉴스레터 구독자 관리</Title>
          <Description>
            Team Grit 뉴스레터 구독자 목록입니다. 총 {totalCount}명 (활성: {activeCount}명, 해지: {unsubscribedCount}명)
          </Description>
        </div>
        <HeaderButtons>
          {selectedIds.size > 0 && (
            <SendSelectedButton onClick={() => openSendModal()}>
              선택 발송 ({selectedIds.size}명)
            </SendSelectedButton>
          )}
          <CopyButton onClick={copyEmails} disabled={filteredSubscribers.length === 0}>
            이메일 복사 ({filteredSubscribers.length})
          </CopyButton>
        </HeaderButtons>
      </Header>

      <FilterBar>
        <SearchInput
          type="text"
          placeholder="이메일 또는 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
            해지 ({unsubscribedCount})
          </StatusFilterButton>
        </StatusFilterGroup>
      </FilterBar>

      {loading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th style={{ width: '40px' }}>
                <Checkbox
                  type="checkbox"
                  checked={
                    filteredSubscribers.filter((s) => s.status === 'ACTIVE').length > 0 &&
                    selectedIds.size === filteredSubscribers.filter((s) => s.status === 'ACTIVE').length
                  }
                  onChange={toggleSelectAll}
                />
              </Th>
              <Th>이메일</Th>
              <Th>이름</Th>
              <Th>상태</Th>
              <Th>유입 경로</Th>
              <Th>구독일</Th>
              <Th>해지일</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <Td>
                  {subscriber.status === 'ACTIVE' && (
                    <Checkbox
                      type="checkbox"
                      checked={selectedIds.has(subscriber.id)}
                      onChange={() => toggleSelect(subscriber.id)}
                    />
                  )}
                </Td>
                <Td>{subscriber.email}</Td>
                <Td>{subscriber.name || '-'}</Td>
                <Td>
                  <StatusBadge $status={subscriber.status}>
                    {subscriber.status === 'ACTIVE' ? '활성' : '해지'}
                  </StatusBadge>
                </Td>
                <Td>
                  <SourceBadge>{subscriber.source || 'direct'}</SourceBadge>
                </Td>
                <Td>{formatDate(subscriber.subscribedAt)}</Td>
                <Td>{formatDate(subscriber.unsubscribedAt)}</Td>
                <Td>
                  <ActionButtons>
                    {subscriber.status === 'ACTIVE' && (
                      <SendButton onClick={() => openSendModal(subscriber.id)}>
                        발송
                      </SendButton>
                    )}
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
                  </ActionButtons>
                </Td>
              </tr>
            ))}
            {filteredSubscribers.length === 0 && (
              <tr>
                <Td colSpan={8}>
                  <EmptyText>
                    {searchTerm ? '검색 결과가 없습니다.' : '구독자가 없습니다.'}
                  </EmptyText>
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* 뉴스레터 선택 모달 */}
      {showNewsletterModal && (
        <ModalOverlay onClick={() => setShowNewsletterModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>발송할 뉴스레터 선택</ModalTitle>
              <ModalClose onClick={() => setShowNewsletterModal(false)}>&times;</ModalClose>
            </ModalHeader>
            <ModalBody>
              {newsletters.length === 0 ? (
                <EmptyText>발송 가능한 뉴스레터가 없습니다.</EmptyText>
              ) : (
                <NewsletterList>
                  {newsletters.map((nl) => (
                    <NewsletterItem
                      key={nl.id}
                      $selected={selectedNewsletterId === nl.id}
                      onClick={() => setSelectedNewsletterId(nl.id)}
                    >
                      <NewsletterRadio
                        type="radio"
                        name="newsletter"
                        checked={selectedNewsletterId === nl.id}
                        onChange={() => setSelectedNewsletterId(nl.id)}
                      />
                      <NewsletterInfo>
                        <NewsletterTitle>{nl.title}</NewsletterTitle>
                        <NewsletterMeta>
                          Vol.{nl.issueNumber} | {nl.status === 'SENT' ? '발송됨' : nl.status === 'SCHEDULED' ? '예약됨' : '초안'}
                        </NewsletterMeta>
                      </NewsletterInfo>
                    </NewsletterItem>
                  ))}
                </NewsletterList>
              )}
            </ModalBody>
            <ModalFooter>
              <ModalCancelButton onClick={() => setShowNewsletterModal(false)}>
                취소
              </ModalCancelButton>
              <ModalConfirmButton
                onClick={handleSendToSubscribers}
                disabled={!selectedNewsletterId || sendingToSubscribers}
              >
                {sendingToSubscribers ? '발송 중...' : '발송하기'}
              </ModalConfirmButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default SubscriberManagement;

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
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

const SourceBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const StatusBadge = styled.span<{ $status: 'ACTIVE' | 'UNSUBSCRIBED' }>`
  display: inline-block;
  padding: 4px 8px;
  background: ${({ $status }) => ($status === 'ACTIVE' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $status }) => ($status === 'ACTIVE' ? '#16a34a' : '#dc2626')};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 20px;
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

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const SendSelectedButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #15803d;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const SendButton = styled.button`
  padding: 6px 12px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #15803d;
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;

  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
`;

const ModalCancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const ModalConfirmButton = styled.button`
  padding: 10px 20px;
  background: #16a34a;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #15803d;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const NewsletterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NewsletterItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? '#16a34a' : '#e5e7eb')};
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? '#f0fdf4' : 'white')};
  transition: all 0.2s;

  &:hover {
    border-color: #16a34a;
  }
`;

const NewsletterRadio = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const NewsletterInfo = styled.div`
  flex: 1;
`;

const NewsletterTitle = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const NewsletterMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
`;
