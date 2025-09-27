import React, { useState } from 'react';
import styled from 'styled-components';
import { BarChart3, FileText } from 'lucide-react';
import NotiTemplateManagement from '../components/noti/NotiTemplateManagement';
import NotiDashboard from '../components/noti/NotiDashboard';

type TabType = 'dashboard' | 'templates';

const NotiManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>알림 관리</Title>
          <Subtitle>알림 발송 현황과 템플릿을 관리합니다</Subtitle>
        </HeaderContent>
      </Header>

      {/* Tab Navigation */}
      <TabContainer>
        <TabButton
          $active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} />
          <span>발송 대시보드</span>
        </TabButton>
        <TabButton
          $active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={18} />
          <span>템플릿 관리</span>
        </TabButton>
      </TabContainer>

      {/* Tab Content */}
      <TabContent>
        {activeTab === 'dashboard' ? (
          <NotiDashboard />
        ) : (
          <NotiTemplateManagement />
        )}
      </TabContent>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 24px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.text.secondary};
  font-size: 15px;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  margin-bottom: -2px;

  ${({ $active, theme }) =>
    $active &&
    `
    border-bottom-color: ${theme.colors.primary};
    background: linear-gradient(180deg, transparent, ${theme.colors.primary}10);
  `}

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  svg {
    transition: ${({ theme }) => theme.transitions.fast};
  }
`;

const TabContent = styled.div`
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default NotiManagement;