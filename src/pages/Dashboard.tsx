import React from 'react';
import styled from 'styled-components';
import StatCard from '../components/dashboard/StatCard';
import StudyCard from '../components/dashboard/StudyCard';
import ActivityCard from '../components/dashboard/ActivityCard';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import CategoryDistributionChart from '../components/dashboard/CategoryDistributionChart';

const Dashboard: React.FC = () => {
  // Mock data
  const stats = [
    {
      label: '전체 회원',
      value: '12,847',
      change: { value: '12.5%', positive: true, description: '지난달 대비' },
      barColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    {
      label: '활성 스터디',
      value: '342',
      change: { value: '8.2%', positive: true, description: '지난주 대비' },
      barColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      label: '월 매출',
      value: '₩45.2M',
      change: { value: '23.4%', positive: true, description: '목표 대비' },
      barColor: '#f59e0b',
    },
    {
      label: '대기중 문의',
      value: '28',
      change: { value: '5건', positive: false, description: '긴급 처리 필요' },
      barColor: '#ef4444',
    },
  ];

  const studyData = [
    {
      title: 'React 심화 스터디',
      schedule: '매주 화요일 19:00-21:00',
      participants: { current: 18, max: 20 },
      progress: 65,
      nextMeeting: 'D-2',
      satisfaction: 4.8,
      status: 'active' as const,
      iconLetter: 'R',
      iconColor: '#eff6ff',
      barColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    {
      title: '알고리즘 마스터',
      schedule: '매주 목요일 20:00-22:00',
      participants: { current: 12, max: 15 },
      progress: 40,
      nextMeeting: 'D-4',
      satisfaction: 4.6,
      status: 'recruiting' as const,
      iconLetter: 'A',
      iconColor: '#d1fae5',
      barColor: '#10b981',
    },
  ];

  const activities = [
    { id: '1', type: 'new-member' as const, title: '새로운 회원 가입', description: '김민수 · park@email.com', timestamp: '2분 전' },
    { id: '2', type: 'study-apply' as const, title: '스터디 참여 신청', description: 'React 심화 스터디 · 이영희', timestamp: '15분 전' },
    { id: '3', type: 'payment' as const, title: '결제 완료', description: '월 정기결제 · ₩30,000', timestamp: '30분 전' },
    { id: '4', type: 'urgent' as const, title: '긴급 문의', description: '로그인 문제 · 최지훈', timestamp: '1시간 전' },
  ];

  const weeklyData = [
    { day: '월', value: 60 },
    { day: '화', value: 80 },
    { day: '수', value: 100 },
    { day: '목', value: 90 },
    { day: '금', value: 70 },
    { day: '토', value: 50 },
    { day: '일', value: 60 },
  ];

  const categoryData = [
    { name: '개발', value: 102, percentage: 30, color: '#6366f1' },
    { name: '외국어', value: 86, percentage: 25, color: '#10b981' },
    { name: '자격증', value: 68, percentage: 20, color: '#f59e0b' },
    { name: '취미', value: 51, percentage: 15, color: '#ef4444' },
    { name: '기타', value: 35, percentage: 10, color: '#8b5cf6' },
  ];

  return (
    <DashboardContainer>
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </StatsGrid>

      <SectionHeader>
        <SectionTitle>진행중인 스터디</SectionTitle>
        <SectionLink href="#">모두 보기 →</SectionLink>
      </SectionHeader>

      <StudyGrid>
        {studyData.map((study, index) => (
          <StudyCard key={index} {...study} />
        ))}
        <ActivityCard activities={activities} />
      </StudyGrid>

      <ChartGrid>
        <WeeklyTrendChart data={weeklyData} />
        <CategoryDistributionChart data={categoryData} total={342} />
      </ChartGrid>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  width: 100%;
  padding: 20px 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
`;

const SectionLink = styled.a`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StudyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

export default Dashboard;