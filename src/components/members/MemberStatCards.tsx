import React from 'react';
import styled from 'styled-components';
import StatCard from '../common/StatCard';
import type { UserStatistics } from '../../types/user';

interface MemberStatCardsProps {
  statistics: UserStatistics;
}

const MemberStatCards: React.FC<MemberStatCardsProps> = ({ statistics }) => {
  const calculateGrowthRate = () => {
    // Mock growth rate calculation
    return 12.5;
  };

  const calculateActiveRate = () => {
    if (statistics.totalUsers === 0) return 0;
    return ((statistics.activeUsers / statistics.totalUsers) * 100).toFixed(1);
  };

  return (
    <StatsGrid>
      <StatCard
        title="전체 회원"
        value={statistics.totalUsers.toLocaleString()}
        subtitle="가입한 전체 회원 수"
        trend={{ value: calculateGrowthRate(), isPositive: true }}
      />
      <StatCard
        title="신규 가입"
        value={statistics.newUsersThisMonth.toLocaleString()}
        subtitle="이번 달 신규 가입자"
        trend={{ value: 23.5, isPositive: true }}
      />
      <StatCard
        title="활성 사용자"
        value={statistics.activeUsers.toLocaleString()}
        subtitle={`전체 대비 ${calculateActiveRate()}%`}
        trend={{ value: 5.2, isPositive: true }}
      />
      <StatCard
        title="탈퇴 회원"
        value={statistics.withdrawnUsers.toLocaleString()}
        subtitle="서비스 탈퇴 회원"
        trend={{ value: 2.1, isPositive: false }}
      />
    </StatsGrid>
  );
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

export default MemberStatCards;