import React from 'react';
import styled from 'styled-components';
import { Filter } from 'lucide-react';

interface NotiFiltersProps {
  eventTypes: string[];
  channelTypes: string[];
  searchFilters: {
    eventType: string;
    channelType: string;
  };
  onFiltersChange: (filters: { eventType: string; channelType: string }) => void;
}

const NotiFilters: React.FC<NotiFiltersProps> = ({
  eventTypes,
  channelTypes,
  searchFilters,
  onFiltersChange
}) => {
  return (
    <FiltersCard>
      <FiltersHeader>
        <Filter style={{ width: '20px', height: '20px', color: '#6b7280' }} />
        <FiltersTitle>검색 및 필터</FiltersTitle>
      </FiltersHeader>
      <FiltersGrid>
        <FilterGroup>
          <Label>Event Type</Label>
          <Select
            value={searchFilters.eventType}
            onChange={(e) => onFiltersChange({...searchFilters, eventType: e.target.value})}
          >
            <option value="">전체</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </FilterGroup>
        <FilterGroup>
          <Label>Channel Type</Label>
          <Select
            value={searchFilters.channelType}
            onChange={(e) => onFiltersChange({...searchFilters, channelType: e.target.value})}
          >
            <option value="">전체</option>
            {channelTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </FilterGroup>
      </FiltersGrid>
    </FiltersCard>
  );
};

// Styled Components
const FiltersCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: 24px;
  margin-bottom: 24px;
`;

const FiltersHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const FiltersTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const FilterGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

export default NotiFilters; 