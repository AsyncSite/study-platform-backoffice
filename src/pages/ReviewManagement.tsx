import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Badge from '../components/common/Badge';
import {
  reviewApi,
  REVIEW_STATUS_LABELS,
  type AdminReviewResponse,
  type ReviewStatus,
  type ReviewListParams,
} from '../api/review';
import type { Page } from '../types/api';

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState<Page<AdminReviewResponse> | null>(null);

  // Filters
  const [filterProductId, setFilterProductId] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: ReviewListParams = {
        page,
        size: 20,
      };
      if (filterProductId.trim()) params.productId = filterProductId.trim();
      if (filterEmail.trim()) params.email = filterEmail.trim();
      if (filterStatus) params.status = filterStatus;

      const data = await reviewApi.getReviews(params);
      setPageInfo(data);
      setReviews(data.content || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      alert('리뷰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, filterProductId, filterEmail, filterStatus]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearch = () => {
    setPage(0);
    fetchReviews();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHide = async (id: number) => {
    if (!window.confirm('이 리뷰를 숨김 처리하시겠습니까?')) return;
    try {
      await reviewApi.hideReview(id);
      alert('리뷰가 숨김 처리되었습니다.');
      fetchReviews();
    } catch (error) {
      console.error('Failed to hide review:', error);
      alert('리뷰 숨김 처리에 실패했습니다.');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('이 리뷰를 복원하시겠습니까?')) return;
    try {
      await reviewApi.restoreReview(id);
      alert('리뷰가 복원되었습니다.');
      fetchReviews();
    } catch (error) {
      console.error('Failed to restore review:', error);
      alert('리뷰 복원에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 리뷰를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await reviewApi.deleteReview(id);
      alert('리뷰가 삭제되었습니다.');
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  const getStatusBadgeVariant = (status: ReviewStatus) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'HIDDEN') return 'warning';
    if (status === 'DELETED') return 'error';
    return 'default';
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return '-';
    return Array.from({ length: 5 }, (_, i) => (i < rating ? '\u2605' : '\u2606')).join('');
  };

  const truncateContent = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  const totalPages = pageInfo?.totalPages || 0;
  const totalElements = pageInfo?.totalElements || 0;

  return (
    <Container>
      <Header>
        <div>
          <Title>리뷰 관리</Title>
          <Subtitle>총 {totalElements}건</Subtitle>
        </div>
      </Header>

      <FilterBar>
        <FilterGroup>
          <FilterLabel>상품 ID</FilterLabel>
          <FilterInput
            type="text"
            value={filterProductId}
            onChange={(e) => setFilterProductId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="상품 ID"
          />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>이메일</FilterLabel>
          <FilterInput
            type="text"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="작성자 이메일"
          />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>상태</FilterLabel>
          <FilterSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="HIDDEN">숨김</option>
            <option value="DELETED">삭제됨</option>
          </FilterSelect>
        </FilterGroup>
        <SearchButton onClick={handleSearch}>검색</SearchButton>
      </FilterBar>

      {loading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : reviews.length === 0 ? (
        <EmptyText>리뷰가 없습니다.</EmptyText>
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>작성자</Th>
                  <Th>상품 ID</Th>
                  <Th>별점</Th>
                  <Th>내용</Th>
                  <Th>상태</Th>
                  <Th>작성일</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <Tr key={review.id}>
                    <Td>{review.id}</Td>
                    <Td>{maskEmail(review.email)}</Td>
                    <TdMono>{review.productId}</TdMono>
                    <TdStars>{renderStars(review.rating)}</TdStars>
                    <TdContent title={review.content}>
                      {truncateContent(review.content)}
                    </TdContent>
                    <Td>
                      <Badge variant={getStatusBadgeVariant(review.status)}>
                        {REVIEW_STATUS_LABELS[review.status] || review.status}
                      </Badge>
                    </Td>
                    <Td>{formatDate(review.createdAt)}</Td>
                    <Td>
                      <ActionButtons>
                        {review.status === 'ACTIVE' && (
                          <HideButton onClick={() => handleHide(review.id)}>
                            숨김
                          </HideButton>
                        )}
                        {review.status === 'HIDDEN' && (
                          <>
                            <RestoreButton onClick={() => handleRestore(review.id)}>
                              복원
                            </RestoreButton>
                            <DeleteButton onClick={() => handleDelete(review.id)}>
                              삭제
                            </DeleteButton>
                          </>
                        )}
                      </ActionButtons>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                이전
              </PageButton>
              <PageInfo>
                {page + 1} / {totalPages}
              </PageInfo>
              <PageButton
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                다음
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

export default ReviewManagement;

// --- Styled Components ---

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
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  width: 180px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  width: 120px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const SearchButton = styled.button`
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background: #4338ca;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 40px;
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
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e0e0e0;
  background: #f9f9f9;
  font-size: 13px;
  white-space: nowrap;
`;

const Tr = styled.tr`
  &:hover {
    background: #f5f5f5;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #333;
`;

const TdMono = styled(Td)`
  font-family: monospace;
  font-size: 12px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TdStars = styled(Td)`
  color: #f59e0b;
  font-size: 14px;
  white-space: nowrap;
`;

const TdContent = styled(Td)`
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
`;

const HideButton = styled(ActionButton)`
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;

  &:hover {
    background: #fde68a;
  }
`;

const RestoreButton = styled(ActionButton)`
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;

  &:hover {
    background: #bbf7d0;
  }
`;

const DeleteButton = styled(ActionButton)`
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;

  &:hover {
    background: #fecaca;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #6b7280;
`;
