import React from 'react';
import styled from 'styled-components';
import { StudyStatus } from '../../types/api';

interface StudyFiltersProps {
  activeFilter: StudyStatus | 'ALL';
  onFilterChange: (filter: StudyStatus | 'ALL') => void;
  viewMode: 'card' | 'list';
  onViewModeChange: (mode: 'card' | 'list') => void;
}

const StudyFilters: React.FC<StudyFiltersProps> = ({
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}) => {
  const filters = [
    { value: 'ALL', label: '전체' },
    { value: StudyStatus.PENDING, label: '대기중' },
    { value: StudyStatus.APPROVED, label: '진행중' },
    { value: StudyStatus.TERMINATED, label: '종료' },
  ];

  return (
    <FilterContainer>
      <ViewToggle>
        <ToggleOption
          className={viewMode === 'card' ? 'active' : ''}
          onClick={() => onViewModeChange('card')}
        >
          카드
        </ToggleOption>
        <ToggleOption
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => onViewModeChange('list')}
        >
          목록
        </ToggleOption>
      </ViewToggle>
      
      <FilterChips>
        {filters.map((filter) => (
          <FilterChip
            key={filter.value}
            className={activeFilter === filter.value ? 'active' : ''}
            onClick={() => onFilterChange(filter.value as StudyStatus | 'ALL')}
          >
            {filter.label}
          </FilterChip>
        ))}
      </FilterChips>
    </FilterContainer>
  );
};

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ViewToggle = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 16px;
  padding: 2px;
`;

const ToggleOption = styled.button`
  padding: 6px 20px;
  border-radius: 14px;
  font-size: 12px;
  transition: ${({ theme }) => theme.transitions.normal};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[600]};
  
  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 10px;
`;

const FilterChip = styled.button`
  padding: 8px 20px;
  border-radius: 16px;
  font-size: 12px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
  
  &.active {
    background: #dbeafe;
    color: #1d4ed8;
    border: 1px solid #3b82f6;
  }
`;

export default StudyFilters;