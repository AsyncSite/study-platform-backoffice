import React, { useState } from 'react';
import styled from 'styled-components';
import type { UserListRequest } from '../../types/user';
import { UserStatus } from '../../types/user';

interface MemberFiltersProps {
  onFilterChange: (filters: Partial<UserListRequest>) => void;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search });
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    onFilterChange({ role: role || undefined });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    onFilterChange({ status: status as UserStatus || undefined });
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    onFilterChange({ provider: provider as any || undefined });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedProvider('');
    onFilterChange({
      search: undefined,
      role: undefined,
      status: undefined,
      provider: undefined
    });
  };

  return (
    <FilterContainer>
      <SearchForm onSubmit={handleSearchSubmit}>
        <SearchInput
          type="text"
          placeholder="이메일 또는 이름으로 검색..."
          value={search}
          onChange={handleSearchChange}
        />
        <SearchButton type="submit">
          <span>🔍</span> 검색
        </SearchButton>
      </SearchForm>

      <FilterRow>
        <FilterGroup>
          <FilterLabel>역할</FilterLabel>
          <FilterSelect value={selectedRole} onChange={(e) => handleRoleChange(e.target.value)}>
            <option value="">전체</option>
            <option value="ROLE_USER">일반회원</option>
            <option value="ROLE_ADMIN">관리자</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>상태</FilterLabel>
          <FilterSelect value={selectedStatus} onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="">전체</option>
            <option value={UserStatus.ACTIVE}>활성</option>
            <option value={UserStatus.INACTIVE}>비활성</option>
            <option value={UserStatus.WITHDRAWN}>탈퇴</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>가입경로</FilterLabel>
          <FilterSelect value={selectedProvider} onChange={(e) => handleProviderChange(e.target.value)}>
            <option value="">전체</option>
            <option value="LOCAL">일반가입</option>
            <option value="GOOGLE">구글</option>
            <option value="KAKAO">카카오</option>
            <option value="NAVER">네이버</option>
          </FilterSelect>
        </FilterGroup>

        <ResetButton onClick={handleReset}>
          <span>↺</span> 초기화
        </ResetButton>
      </FilterRow>
    </FilterContainer>
  );
};

const FilterContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const SearchForm = styled.form`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 8px;
  font-size: 14px;
  transition: ${({ theme }) => theme.transitions.normal};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: 6px;
  font-size: 14px;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  span {
    font-size: 16px;
  }
`;

export default MemberFilters;