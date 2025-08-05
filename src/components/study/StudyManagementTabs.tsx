import React from 'react';
import styled from 'styled-components';

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
    { id: 'PENDING' as StudyTab, label: '승인 대기', count: pendingCount, icon: '⏳' },
    { id: 'ACTIVE' as StudyTab, label: '활성 스터디', count: activeCount, icon: '✅' },
    { id: 'INACTIVE' as StudyTab, label: '비활성 스터디', count: inactiveCount, icon: '🚫' },
  ];

  return (
    <TabContainer>
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          $active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          <TabIcon>{tab.icon}</TabIcon>
          <TabLabel>{tab.label}</TabLabel>
          <TabCount $active={activeTab === tab.id}>{tab.count}</TabCount>
        </Tab>
      ))}
    </TabContainer>
  );
};

const TabContainer = styled.div`
  display: flex;
  gap: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 24px;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${({ $active, theme }) => 
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.text.secondary};
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  top: 2px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TabIcon = styled.span`
  font-size: 20px;
`;

const TabLabel = styled.span``;

const TabCount = styled.span<{ $active: boolean }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.gray[50]};
  color: ${({ $active, theme }) => 
    $active ? 'white' : theme.colors.text.secondary};
`;

export default StudyManagementTabs;