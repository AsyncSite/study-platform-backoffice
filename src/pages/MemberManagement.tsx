import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import type { User, UserListRequest, UserStatistics } from '../types/user';
import MemberStatCards from '../components/members/MemberStatCards';
import MemberFilters from '../components/members/MemberFilters';
import MemberTable from '../components/members/MemberTable';
import MemberDetailPanel from '../components/members/MemberDetailPanel';
import Pagination from '../components/common/Pagination';

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [filters, setFilters] = useState<UserListRequest>({
    page: 0,
    size: 20,
    sort: 'createdAt,desc'
  });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [filters, currentPage]);

  // Fetch statistics
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers({
        ...filters,
        page: currentPage
      });
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      
      // 대부분의 에러는 interceptor에서 처리됨
      // 여기서는 UI 상태만 관리
      setUsers([]);
      setTotalPages(0);
      setTotalElements(0);
      
      // 500 에러의 경우 추가 컨텍스트 제공
      if (error.response?.status === 500) {
        // interceptor에서 이미 메시지 표시됨
        // 필요시 페이지별 특별한 처리 추가 가능
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await usersApi.getUserStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      
      // 통계 조회 실패는 치명적이지 않으므로 기본값 설정
      setStatistics({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        inactiveUsers: 0,
        withdrawnUsers: 0,
        monthlyGrowth: 0
      });
      
      // 에러 메시지는 interceptor에서 이미 표시됨
    }
  };

  const handleFilterChange = (newFilters: Partial<UserListRequest>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(0);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleUserUpdate = async () => {
    // Refresh users list after update
    await fetchUsers();
    if (statistics) {
      await fetchStatistics();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Container>
      <Header>
        <Title>회원 관리</Title>
        <Subtitle>플랫폼에 가입한 회원들을 관리합니다</Subtitle>
      </Header>

      {statistics && <MemberStatCards statistics={statistics} />}

      <ContentArea>
        <MainContent>
          <MemberFilters onFilterChange={handleFilterChange} />
          
          <TableSection>
            <TableHeader>
              <TotalCount>전체 {totalElements}명</TotalCount>
              <ExportButton onClick={() => handleExport()}>
                <span>📥</span> 엑셀 다운로드
              </ExportButton>
            </TableHeader>

            <MemberTable
              users={users}
              loading={loading}
              onUserSelect={handleUserSelect}
              selectedUserId={selectedUser?.id}
            />

            {totalPages > 1 && (
              <PaginationWrapper>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </PaginationWrapper>
            )}
          </TableSection>
        </MainContent>

        {selectedUser && (
          <MemberDetailPanel
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUserUpdate}
          />
        )}
      </ContentArea>
    </Container>
  );

  async function handleExport() {
    try {
      const blob = await usersApi.exportUsers(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to export users:', error);
      
      if (error.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('회원 목록을 다운로드할 권한이 없습니다.');
      } else {
        alert(error.response?.data?.message || '회원 목록 다운로드에 실패했습니다.');
      }
    }
  }
};

const Container = styled.div`
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ContentArea = styled.div`
  display: flex;
  gap: 24px;
  position: relative;
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TableSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TotalCount = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const PaginationWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: center;
`;

export default MemberManagement;