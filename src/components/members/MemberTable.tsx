import React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { User } from '../../types/user';
import { UserStatus } from '../../types/user';
import Badge from '../common/Badge';

interface MemberTableProps {
  users: User[];
  loading: boolean;
  onUserSelect: (user: User) => void;
  selectedUserId?: string;
}

const MemberTable: React.FC<MemberTableProps> = ({
  users,
  loading,
  onUserSelect,
  selectedUserId
}) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'OPERATOR':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'OPERATOR':
        return '운영자';
      case 'USER':
        return '일반회원';
      default:
        return role;
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'warning';
      case UserStatus.WITHDRAWN:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return '활성';
      case UserStatus.INACTIVE:
        return '비활성';
      case UserStatus.WITHDRAWN:
        return '탈퇴';
      default:
        return status;
    }
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'google':
        return '🇬';
      case 'kakao':
        return '🇰';
      case 'naver':
        return '🇳';
      default:
        return '📧';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy.MM.dd', { locale: ko });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MM.dd HH:mm', { locale: ko });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner>⏳</LoadingSpinner>
        <LoadingText>회원 목록을 불러오는 중...</LoadingText>
      </LoadingContainer>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyContainer>
        <EmptyIcon>👥</EmptyIcon>
        <EmptyText>조건에 맞는 회원이 없습니다</EmptyText>
      </EmptyContainer>
    );
  }

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>회원정보</Th>
            <Th>역할</Th>
            <Th>상태</Th>
            <Th>가입일</Th>
            <Th>마지막 로그인</Th>
            <Th>스터디</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              onClick={() => onUserSelect(user)}
              selected={selectedUserId === user.id}
            >
              <Td>
                <UserInfo>
                  <UserAvatar>
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} />
                    ) : (
                      <AvatarPlaceholder>{user.name[0]}</AvatarPlaceholder>
                    )}
                  </UserAvatar>
                  <UserDetails>
                    <UserName>{user.name}</UserName>
                    <UserEmail>
                      <ProviderIcon>{getProviderIcon(user.provider)}</ProviderIcon>
                      {user.email}
                    </UserEmail>
                  </UserDetails>
                </UserInfo>
              </Td>
              <Td>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </Td>
              <Td>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {getStatusLabel(user.status)}
                </Badge>
              </Td>
              <Td>{formatDate(user.createdAt)}</Td>
              <Td>{formatDateTime(user.lastLoginAt)}</Td>
              <Td>
                <StudyCount>{user.studyCount || 0}개</StudyCount>
              </Td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[600]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  white-space: nowrap;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  background: ${({ selected, theme }) => selected ? theme.colors.primary + '10' : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[700]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const UserEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ProviderIcon = styled.span`
  font-size: 14px;
`;

const StudyCount = styled.div`
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
`;

const LoadingSpinner = styled.div`
  font-size: 48px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 16px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

export default MemberTable;