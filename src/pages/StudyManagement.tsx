import React, { useState } from 'react';
import styled from 'styled-components';
import StudyStatusOverview from '../components/study/StudyStatusOverview';
import StudyRecentActivity, { type Activity } from '../components/study/StudyRecentActivity';
import StudyCard from '../components/study/StudyCard';
import StudyFilters from '../components/study/StudyFilters';
import Pagination from '../components/common/Pagination';
import Button, { ButtonVariant } from '../components/common/Button';
import Card from '../components/common/Card';
import type { StudyResponse } from '../types/api';
import { StudyStatus } from '../types/api';

// Mock data
const mockStudies: StudyResponse[] = [
  {
    id: 'ST-2025-001',
    title: 'React 심화 스터디',
    description: 'React의 고급 기능과 최적화 기법을 학습합니다',
    proposerId: 'developer@email.com',
    status: StudyStatus.PENDING,
    createdAt: '2025-01-17T14:30:00',
    updatedAt: '2025-01-17T14:30:00',
  },
  {
    id: 'ST-2025-002',
    title: '알고리즘 문제풀이',
    description: '매주 알고리즘 문제를 풀고 리뷰합니다',
    proposerId: 'coder@email.com',
    status: StudyStatus.APPROVED,
    createdAt: '2025-01-10T10:00:00',
    updatedAt: '2025-01-10T10:00:00',
  },
  {
    id: 'ST-2025-003',
    title: 'Python 기초',
    description: 'Python 프로그래밍 기초 학습',
    proposerId: 'student@email.com',
    status: StudyStatus.REJECTED,
    createdAt: '2025-01-16T09:00:00',
    updatedAt: '2025-01-16T15:00:00',
  },
  // Add more mock data
];

const mockActivities: Activity[] = [
  { id: '1', type: 'approved', title: 'React 스터디 승인됨', timestamp: '10분 전' },
  { id: '2', type: 'pending', title: '새 스터디 제안 도착', timestamp: '25분 전' },
  { id: '3', type: 'rejected', title: 'Python 스터디 거절됨', timestamp: '1시간 전' },
];

const StudyManagement: React.FC = () => {
  const [studies, setStudies] = useState<StudyResponse[]>(mockStudies);
  const [filter, setFilter] = useState<StudyStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const itemsPerPage = 9;

  // Filter studies
  const filteredStudies = studies.filter((study) => {
    const matchesFilter = filter === 'ALL' || study.status === filter;
    const matchesSearch = 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.proposerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudies.length / itemsPerPage);
  const paginatedStudies = filteredStudies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status distribution
  const distribution = {
    approved: studies.filter(s => s.status === StudyStatus.APPROVED).length,
    pending: studies.filter(s => s.status === StudyStatus.PENDING).length,
    rejected: studies.filter(s => s.status === StudyStatus.REJECTED).length,
  };

  const handleApprove = (id: string) => {
    setStudies(prev => 
      prev.map(study => 
        study.id === id ? { ...study, status: StudyStatus.APPROVED } : study
      )
    );
  };

  const handleReject = (id: string) => {
    setStudies(prev => 
      prev.map(study => 
        study.id === id ? { ...study, status: StudyStatus.REJECTED } : study
      )
    );
  };

  const handleTerminate = (id: string) => {
    setStudies(prev => 
      prev.map(study => 
        study.id === id ? { ...study, status: StudyStatus.TERMINATED } : study
      )
    );
  };

  const handleDelete = (id: string) => {
    setStudies(prev => prev.filter(study => study.id !== id));
  };

  const handleView = (id: string) => {
    console.log('View study:', id);
  };

  return (
    <StudyManagementContainer>
      <DetailLayout>
        {/* Left Panel */}
        <LeftPanel>
          <StudyStatusOverview 
            pendingCount={distribution.pending}
            distribution={distribution}
          />
          
          <StudyRecentActivity activities={mockActivities} />
          
          <QuickActions>
            <Button variant={ButtonVariant.PRIMARY} fullWidth>
              + 새 스터디 추가
            </Button>
            <Button variant={ButtonVariant.SECONDARY} fullWidth>
              📊 리포트 생성
            </Button>
          </QuickActions>
        </LeftPanel>
        
        {/* Right Panel */}
        <RightPanel>
          <PanelHeader>
            <PanelTitle>스터디 관리</PanelTitle>
            
            <ViewControls>
              <StudyFilters
                activeFilter={filter}
                onFilterChange={setFilter}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </ViewControls>
          </PanelHeader>
          
          <SearchBar
            type="text"
            placeholder="🔍 스터디 검색 (제목, 제안자, ID)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <StudyGrid>
            {paginatedStudies.map((study) => (
              <StudyCard
                key={study.id}
                study={study}
                onApprove={handleApprove}
                onReject={handleReject}
                onTerminate={handleTerminate}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </StudyGrid>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </RightPanel>
      </DetailLayout>
    </StudyManagementContainer>
  );
};

const StudyManagementContainer = styled.div`
  width: 100%;
  padding: 20px 0;
`;

const DetailLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RightPanel = styled(Card)`
  padding: 30px;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 12px 20px;
  border-radius: 20px;
  border: none;
  background: ${({ theme }) => theme.colors.gray[100]};
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:focus {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const StudyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export default StudyManagement;