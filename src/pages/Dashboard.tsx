import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { studyApi } from '../api/study';
import type { UserStatistics } from '../types/user';
import type { StudyResponse } from '../types/api';
import { StudyStatus } from '../types/api';
import { useNotification } from '../contexts/NotificationContext';
import StatCard from '../components/dashboard/StatCard';
import StudyCard from '../components/dashboard/StudyCard';
import ActivityCard from '../components/dashboard/ActivityCard';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import CategoryDistributionChart from '../components/dashboard/CategoryDistributionChart';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(null);
  const [studies, setStudies] = useState<StudyResponse[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchStudies();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await usersApi.getUserStatistics();
      setUserStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      
      // 401 에러는 이미 interceptor에서 처리됨
      // 500 에러도 interceptor에서 처리되지만 추가 메시지 표시 가능
      if (error.response?.status === 500) {
        // showToast는 이미 interceptor에서 처리됨
        // 대신 기본 통계 데이터를 설정하여 UI가 깨지지 않도록 함
        setUserStatistics({
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          newUsersThisMonth: 0,
          inactiveUsers: 0,
          withdrawnUsers: 0,
          monthlyGrowth: 0
        });
      } else if (!error.response) {
        // 네트워크 에러는 interceptor에서 처리됨
        setUserStatistics(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudies = async () => {
    try {
      const page = await studyApi.getPagedStudies(0, 2, 'createdAt,desc');
      if (page && page.content) {
        setStudies(page.content);
      }
    } catch (error: any) {
      console.error('Failed to fetch studies:', error);
      
      // 에러 발생 시 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setStudies([]);
      
      // 추가 컨텍스트 메시지 표시 (선택적)
      if (error.response?.status === 500) {
        // interceptor에서 이미 메시지를 표시했으므로 추가 액션만 수행
        console.log('스터디 데이터를 불러올 수 없습니다. 기본 화면을 표시합니다.');
      }
    }
  };

  const calculateGrowthRate = (current: number, previous: number): string => {
    if (previous === 0) return '0%';
    const rate = ((current - previous) / previous * 100).toFixed(1);
    return `${rate}%`;
  };

  const getStats = () => {
    if (!userStatistics) {
      return [
        {
          label: '전체 회원',
          value: '-',
          change: { value: '-', positive: true, description: '지난달 대비' },
          barColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        },
        {
          label: '활성 스터디',
          value: '-',
          change: { value: '-', positive: true, description: '지난주 대비' },
          barColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        },
        {
          label: '월 매출',
          value: '-',
          change: { value: '-', positive: true, description: '목표 대비' },
          barColor: '#f59e0b',
        },
        {
          label: '대기중 문의',
          value: '-',
          change: { value: '-', positive: false, description: '긴급 처리 필요' },
          barColor: '#ef4444',
        },
      ];
    }

    const monthlyGrowth = userStatistics.newUsersThisMonth > 0 
      ? calculateGrowthRate(userStatistics.newUsersThisMonth, userStatistics.newUsersThisMonth - userStatistics.newUsersThisWeek)
      : '0%';

    return [
      {
        label: '전체 회원',
        value: userStatistics.totalUsers.toLocaleString() + '명',
        change: { 
          value: monthlyGrowth, 
          positive: parseFloat(monthlyGrowth) >= 0, 
          description: '지난달 대비' 
        },
        barColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
      {
        label: '활성 회원',
        value: userStatistics.activeUsers.toLocaleString() + '명',
        change: { 
          value: `${((userStatistics.activeUsers / userStatistics.totalUsers) * 100).toFixed(1)}%`, 
          positive: true, 
          description: '활성률' 
        },
        barColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },
      {
        label: '신규 가입',
        value: userStatistics.newUsersToday.toLocaleString() + '명',
        change: { 
          value: `이번주 ${userStatistics.newUsersThisWeek}명`, 
          positive: true, 
          description: '오늘 기준' 
        },
        barColor: '#f59e0b',
      },
      {
        label: '비활성 회원',
        value: userStatistics.inactiveUsers.toLocaleString() + '명',
        change: { 
          value: `탈퇴 ${userStatistics.withdrawnUsers}명`, 
          positive: false, 
          description: '관리 필요' 
        },
        barColor: '#ef4444',
      },
    ];
  };

  const stats = getStats();

  // Transform API studies to dashboard format
  const studyData = studies.map((study, index) => ({
    title: study.title,
    schedule: '스케줄 정보 미제공', // API에서 제공하지 않음
    participants: { 
      current: Math.floor(Math.random() * 15) + 5, // 임시 데이터
      max: 20 
    },
    progress: Math.floor(Math.random() * 60) + 20, // 임시 데이터
    nextMeeting: `D-${Math.floor(Math.random() * 7) + 1}`, // 임시 데이터
    satisfaction: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 ~ 5.0
    status: study.status === StudyStatus.APPROVED ? 'active' as const : 'recruiting' as const,
    iconLetter: study.title.charAt(0).toUpperCase(),
    iconColor: index % 2 === 0 ? '#eff6ff' : '#d1fae5',
    barColor: index % 2 === 0 
      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
      : '#10b981',
  }));

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
        {studyData.length > 0 ? (
          studyData.map((study, index) => (
            <StudyCard key={index} {...study} />
          ))
        ) : (
          <EmptyMessage>진행중인 스터디가 없습니다.</EmptyMessage>
        )}
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

const EmptyMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  padding: 40px;
`;

export default Dashboard;