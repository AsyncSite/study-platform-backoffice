import React from 'react';
import styled from 'styled-components';
import { Clock, Activity, XCircle } from 'lucide-react';

export type StudyTab = 'PENDING' | 'ACTIVE' | 'INACTIVE';

interface StudyManagementTabsProps {
  activeTab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
  pendingCount: number;
  activeCount: number;
  inactiveCount: number;
}

const StudyManagementTabs: React.FC<StudyManagementTabsProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  activeCount,
  inactiveCount,
}) => {
  const tabs = [
    { 
      id: 'PENDING' as StudyTab, 
      label: '승인 대기', 
      count: pendingCount, 
      icon: Clock,
      color: 'warning'
    },
    { 
      id: 'ACTIVE' as StudyTab, 
      label: '활성 스터디', 
      count: activeCount, 
      icon: Activity,
      color: 'success'
    },
    { 
      id: 'INACTIVE' as StudyTab, 
      label: '비활성 스터디', 
      count: inactiveCount, 
      icon: XCircle,
      color: 'secondary'
    },
  ];

  return (
    <TabContainer>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <Tab
            key={tab.id}
            $active={activeTab === tab.id}
            $color={tab.color}
            onClick={() => onTabChange(tab.id)}
          >
            <TabContent>
              <TabIcon $active={activeTab === tab.id} $color={tab.color}>
                <IconComponent size={20} />
              </TabIcon>
              <TabTextGroup>
                <TabLabel>{tab.label}</TabLabel>
                <TabDescription>
                  {tab.id === 'PENDING' && '관리자 검토 필요'}
                  {tab.id === 'ACTIVE' && '진행 중인 스터디'}
                  {tab.id === 'INACTIVE' && '종료/거절된 스터디'}
                </TabDescription>
              </TabTextGroup>
            </TabContent>
            <TabCount $active={activeTab === tab.id} $color={tab.color}>
              {tab.count}
            </TabCount>
          </Tab>
        );
      })}
    </TabContainer>
  );
};

const TabContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const Tab = styled.button<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: ${({ $active, theme }) => 
    $active ? theme.colors.background : theme.colors.gray[50]};
  border: 1px solid ${({ $active, theme, $color }) => {
    if (!$active) return theme.colors.border;
    switch ($color) {
      case 'warning': return theme.colors.warning + '30';
      case 'success': return theme.colors.success + '30';
      case 'secondary': return theme.colors.primary + '30';
      default: return theme.colors.border;
    }
  }};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({ $active, theme }) => 
    $active ? theme.shadows.medium : theme.shadows.small};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    border-color: ${({ theme, $color }) => {
      switch ($color) {
        case 'warning': return theme.colors.warning + '50';
        case 'success': return theme.colors.success + '50';
        case 'secondary': return theme.colors.primary + '50';
        default: return theme.colors.primary + '50';
      }
    }};
  }
`;

const TabContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const TabIcon = styled.div<{ $active: boolean; $color: string }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: ${({ $active, theme, $color }) => {
    if (!$active) return theme.colors.gray[100];
    switch ($color) {
      case 'warning': return theme.colors.warning + '15';
      case 'success': return theme.colors.success + '15';
      case 'secondary': return theme.colors.primary + '15';
      default: return theme.colors.primary + '15';
    }
  }};
  color: ${({ $active, theme, $color }) => {
    if (!$active) return theme.colors.text.secondary;
    switch ($color) {
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      case 'secondary': return theme.colors.primary;
      default: return theme.colors.primary;
    }
  }};
  transition: all 0.2s;
`;

const TabTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const TabLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TabDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
`;

const TabCount = styled.div<{ $active: boolean; $color: string }>`
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 700;
  background: ${({ $active, theme, $color }) => {
    if (!$active) return theme.colors.gray[100];
    switch ($color) {
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      case 'secondary': return theme.colors.primary;
      default: return theme.colors.primary;
    }
  }};
  color: ${({ $active, theme }) => 
    $active ? 'white' : theme.colors.text.secondary};
  transition: all 0.2s;
`;

export default StudyManagementTabs;