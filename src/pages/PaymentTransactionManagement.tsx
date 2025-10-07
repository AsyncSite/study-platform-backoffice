import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Badge from '../components/common/Badge';

interface Transaction {
  transactionId: string;
  userId: string;
  status: string;
  amount: number;
  productId: string;
  paymentMethod: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

type TabType = 'all' | 'pending-deposits';

const PaymentTransactionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 필터 (전체 탭에서만 사용)
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [userIdSearch, setUserIdSearch] = useState<string>('');

  const fetchTransactions = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
        sortBy: 'createdAt',
        sortDir: 'DESC'
      });

      // 탭에 따라 필터 자동 적용
      if (activeTab === 'pending-deposits') {
        params.append('status', 'CREATED');
        params.append('paymentMethod', 'ACCOUNT_TRANSFER');
      } else {
        // 전체 탭에서는 사용자 지정 필터 사용
        if (statusFilter) params.append('status', statusFilter);
        if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
        if (userIdSearch) params.append('userId', userIdSearch);
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/payment-core/api/v1/admin/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();

      // Handle both direct response (local) and ApiResponse wrapper (production)
      const data = result.data || result; // Production has result.data, local doesn't

      if (data.content) {
        console.log('Setting transactions:', data.content.length, 'items');
        setTransactions(data.content);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        console.warn('No content found in response:', result);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      alert('트랜잭션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, paymentMethodFilter, userIdSearch]);

  useEffect(() => {
    fetchTransactions(0);
  }, [fetchTransactions]);

  const handleConfirmDeposit = async (transaction: Transaction) => {
    const confirmed = window.confirm(
      `입금을 확인하시겠습니까?\n\n` +
      `Transaction ID: ${transaction.transactionId}\n` +
      `사용자: ${transaction.userId}\n` +
      `금액: ₩${transaction.amount.toLocaleString()}\n\n` +
      `확인 후 결제가 완료되고 멤버십이 활성화됩니다.`
    );

    if (!confirmed) return;

    try {
      // Checkout Service Internal API 호출 (transactionId로 수동 입금 확인)
      const response = await fetch(
        `http://localhost:6081/internal/api/v1/checkout/payment-intents/by-transaction/${transaction.transactionId}/manual-confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Manual confirm failed:', errorData);
        throw new Error(errorData.message || '입금 확인 처리에 실패했습니다.');
      }

      alert('✅ 입금이 확인되었습니다!\n\n결제가 완료되고 멤버십이 활성화됩니다.');
      fetchTransactions(currentPage); // 목록 새로고침
    } catch (error: any) {
      console.error('Failed to confirm deposit:', error);
      alert(`❌ 입금 확인 처리 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes('SUCCESS') || status === 'COMPLETED') return 'success';
    if (status.includes('FAILED') || status === 'FAILED') return 'error';
    if (status.includes('PENDING') || status === 'PENDING' || status === 'CREATED') return 'warning';
    if (status.includes('REFUND')) return 'primary';
    if (status === 'CANCELLED') return 'default';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CREATED': '생성됨',
      'PENDING': '대기중',
      'COMPLETED': '완료',
      'FAILED': '실패',
      'CANCELLED': '취소',
      'PAYMENT_SUCCESS': '결제 성공',
      'PAYMENT_FAILED': '결제 실패',
      'PAYMENT_PENDING': '결제 대기',
      'REFUNDED': '환불 완료',
      'REFUND_REQUESTED': '환불 요청',
      'PROVISION_SUCCESS': '지급 완료',
      'PROVISION_FAILED': '지급 실패'
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'CARD': '카드',
      'ACCOUNT_TRANSFER': '계좌이체',
      'KAKAOPAY': '카카오페이',
      'NAVERPAY': '네이버페이'
    };
    return labels[method] || method;
  };

  return (
    <Container>
      <Header>
        <Title>결제 관리</Title>
        <Subtitle>총 {totalElements}건</Subtitle>
      </Header>

      <SubTabContainer>
        <SubTab
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        >
          📋 전체 트랜잭션
        </SubTab>
        <SubTab
          active={activeTab === 'pending-deposits'}
          onClick={() => setActiveTab('pending-deposits')}
        >
          ⏳ 입금 대기 목록
        </SubTab>
      </SubTabContainer>

      {activeTab === 'all' && (
        <FilterSection>
          <FilterGroup>
            <Label>상태</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">전체</option>
              <option value="CREATED">생성됨</option>
              <option value="COMPLETED">완료</option>
              <option value="FAILED">실패</option>
              <option value="CANCELLED">취소</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>결제 수단</Label>
            <Select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
              <option value="">전체</option>
              <option value="CARD">카드</option>
              <option value="ACCOUNT_TRANSFER">계좌이체</option>
              <option value="KAKAOPAY">카카오페이</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>사용자 ID</Label>
            <Input
              type="text"
              placeholder="사용자 ID 검색"
              value={userIdSearch}
              onChange={(e) => setUserIdSearch(e.target.value)}
            />
          </FilterGroup>
        </FilterSection>
      )}

      {activeTab === 'pending-deposits' && (
        <InfoMessage>
          💡 계좌이체로 입금 대기 중인 트랜잭션만 표시됩니다. 입금 확인 후 "입금 확인" 버튼을 클릭하세요.
        </InfoMessage>
      )}

      {transactions.length === 0 && !loading ? (
        <LoadingMessage>결제내역이 없습니다.</LoadingMessage>
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Transaction ID</Th>
                  <Th>사용자 ID</Th>
                  <Th>상품 ID</Th>
                  <Th>금액</Th>
                  <Th>결제 수단</Th>
                  <Th>상태</Th>
                  <Th>생성일</Th>
                  {activeTab === 'pending-deposits' && <Th>작업</Th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // 스켈레톤 로딩
                  Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonRow key={index}>
                      <Td><SkeletonBox width="120px" /></Td>
                      <Td><SkeletonBox width="140px" /></Td>
                      <Td><SkeletonBox width="160px" /></Td>
                      <Td><SkeletonBox width="80px" /></Td>
                      <Td><SkeletonBox width="70px" /></Td>
                      <Td><SkeletonBox width="60px" /></Td>
                      <Td><SkeletonBox width="120px" /></Td>
                      {activeTab === 'pending-deposits' && <Td><SkeletonBox width="80px" /></Td>}
                    </SkeletonRow>
                  ))
                ) : (
                  transactions.map((transaction) => (
                  <Tr key={transaction.transactionId}>
                    <Td>{transaction.transactionId}</Td>
                    <Td>{transaction.userId}</Td>
                    <Td>{transaction.productId}</Td>
                    <Td>₩{transaction.amount.toLocaleString()}</Td>
                    <Td>{getPaymentMethodLabel(transaction.paymentMethod)}</Td>
                    <Td>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {getStatusLabel(transaction.status)}
                      </Badge>
                    </Td>
                    <Td>
                      {format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </Td>
                    {activeTab === 'pending-deposits' && (
                      <Td>
                        <ActionButton onClick={() => handleConfirmDeposit(transaction)}>
                          ✓ 입금 확인
                        </ActionButton>
                      </Td>
                    )}
                  </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>

          <Pagination>
            <PaginationButton
              onClick={() => fetchTransactions(currentPage - 1)}
              disabled={currentPage === 0}
            >
              이전
            </PaginationButton>
            <PageInfo>
              {currentPage + 1} / {totalPages}
            </PageInfo>
            <PaginationButton
              onClick={() => fetchTransactions(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              다음
            </PaginationButton>
          </Pagination>
        </>
      )}
    </Container>
  );
};

export default PaymentTransactionManagement;

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
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const SubTabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0;
`;

const SubTab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ active }) => (active ? '#4CAF50' : '#666')};
  background: ${({ active }) => (active ? '#f0f9f0' : 'transparent')};
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? '#4CAF50' : 'transparent')};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4CAF50;
    background: #f0f9f0;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  background: #f9f9f9;
  font-size: 14px;
`;

const Tr = styled.tr`
  &:hover {
    background: #f5f5f5;
  }
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  color: #333;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f5f5f5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #666;
`;

const InfoMessage = styled.div`
  padding: 12px 16px;
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
  border-radius: 4px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #2e7d32;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #45a049;
  }
`;

const SkeletonRow = styled.tr`
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const SkeletonBox = styled.div<{ width?: string }>`
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
  width: ${({ width }) => width || '100%'};

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

