import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { newsletterApi, type Subscriber } from '../api/newsletter';

const SubscriberManagement: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const data = await newsletterApi.getSubscribers();
      setSubscribers(data.subscribers);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <Container>
      <Header>
        <div>
          <Title>뉴스레터 구독자 관리</Title>
          <Description>
            Team Grit 뉴스레터 구독자 목록입니다. 총 {totalCount}명의 활성 구독자가 있습니다.
          </Description>
        </div>
        <CopyButton onClick={copyEmails} disabled={filteredSubscribers.length === 0}>
          이메일 복사 ({filteredSubscribers.length})
        </CopyButton>
      </Header>

      <SearchBox>
        <SearchInput
          type="text"
          placeholder="이메일 또는 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBox>

      {loading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>이메일</Th>
              <Th>이름</Th>
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
                  <SourceBadge>{subscriber.source || 'direct'}</SourceBadge>
                </Td>
                <Td>{formatDate(subscriber.subscribedAt)}</Td>
                <Td>
                  <UnsubscribeButton
                    onClick={() => handleUnsubscribe(subscriber.email)}
                    disabled={unsubscribing === subscriber.email}
                  >
                    {unsubscribing === subscriber.email ? '처리중...' : '구독 취소'}
                  </UnsubscribeButton>
                </Td>
              </tr>
            ))}
            {filteredSubscribers.length === 0 && (
              <tr>
                <Td colSpan={5}>
                  <EmptyText>
                    {searchTerm ? '검색 결과가 없습니다.' : '구독자가 없습니다.'}
                  </EmptyText>
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
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

const SourceBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4338ca;
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
