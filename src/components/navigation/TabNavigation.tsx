import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

interface Tab {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: '대시보드', icon: '📊', path: '/dashboard' },
  { id: 'members', label: '회원 관리', icon: '👥', path: '/members' },
  { id: 'studies', label: '스터디 관리', icon: '📚', path: '/studies' },
  { id: 'payments', label: '결제 관리', icon: '💰', path: '/payments' },
  { id: 'analytics', label: '통계/분석', icon: '📈', path: '/analytics' },
  { id: 'support', label: '문의/지원', icon: '💬', path: '/support' },
  { id: 'settings', label: '설정', icon: '⚙️', path: '/settings' },
];

const TabNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <TabNav>
      <TabList>
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            className={currentPath === tab.path ? 'active' : ''}
            onClick={() => handleTabClick(tab.path)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </TabItem>
        ))}
      </TabList>
    </TabNav>
  );
};

const TabNav = styled.nav`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 10px;
  padding: 10px;
  margin: 20px 0;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const TabList = styled.div`
  display: flex;
  gap: 20px;
  position: relative;
`;

const TabItem = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 15px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[500]};
  transition: ${({ theme }) => theme.transitions.normal};
  background: transparent;
  
  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
  
  &.active {
    background: #eff6ff;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

export default TabNavigation;