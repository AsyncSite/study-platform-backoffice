import React from 'react';
import styled from 'styled-components';
import { Eye, Edit, Trash2, Mail, MessageSquare, Bell } from 'lucide-react';
import type { NotiTemplate } from '../../api/noti';

interface NotiTemplateCardProps {
  template: NotiTemplate;
  onView: (template: NotiTemplate) => void;
  onEdit: (template: NotiTemplate) => void;
  onDelete: (template: NotiTemplate) => void;
}

const NotiTemplateCard: React.FC<NotiTemplateCardProps> = ({
  template,
  onView,
  onEdit,
  onDelete
}) => {
  const getChannelIcon = (channelType: string) => {
    const iconStyle = { width: '16px', height: '16px' };
    switch (channelType) {
      case "EMAIL": return <Mail style={iconStyle} />;
      case "DISCORD": return <MessageSquare style={iconStyle} />;
      case "PUSH": return <Bell style={iconStyle} />;
      default: return <MessageSquare style={iconStyle} />;
    }
  };

  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case "EMAIL": return "email";
      case "DISCORD": return "discord";
      case "PUSH": return "push";
      default: return "default";
    }
  };

  return (
    <TemplateCard>
      <CardHeader>
        <TemplateTitle>{template.titleTemplate}</TemplateTitle>
        <ChannelBadge channelType={getChannelColor(template.channelType)}>
          {getChannelIcon(template.channelType)}
          {template.channelType}
        </ChannelBadge>
      </CardHeader>
      
      <CardContent>
        <FieldGroup>
          <FieldLabel>Event Type</FieldLabel>
          <FieldValue>{template.eventType}</FieldValue>
        </FieldGroup>
        
        <FieldGroup>
          <FieldLabel>Content Preview</FieldLabel>
          <ContentPreview>{template.contentTemplate}</ContentPreview>
        </FieldGroup>
        
        <CardFooter>
          <StatusBadge active={template.active}>
            {template.active ? '활성' : '비활성'}
          </StatusBadge>
          <ActionButtons>
            <ActionButton onClick={() => onView(template)} title="상세보기">
              <Eye style={{ width: '16px', height: '16px' }} />
            </ActionButton>
            <ActionButton onClick={() => onEdit(template)} title="수정">
              <Edit style={{ width: '16px', height: '16px' }} />
            </ActionButton>
            <ActionButton 
              onClick={() => onDelete(template)} 
              title="비활성화"
              variant="danger"
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
            </ActionButton>
          </ActionButtons>
        </CardFooter>
      </CardContent>
    </TemplateCard>
  );
};

// Styled Components
const TemplateCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.large};
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const CardHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const TemplateTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  flex: 1;
  margin: 0;
`;

const ChannelBadge = styled.span<{ channelType: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  
  ${({ channelType, theme }) => {
    switch (channelType) {
      case 'email':
        return `
          background: ${theme.colors.primary}20;
          color: ${theme.colors.primary};
        `;
      case 'discord':
        return `
          background: #5865f220;
          color: #5865f2;
        `;
      case 'push':
        return `
          background: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      default:
        return `
          background: ${theme.colors.gray[200]};
          color: ${theme.colors.gray[600]};
        `;
    }
  }}
`;

const CardContent = styled.div`
  padding: 20px;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const FieldValue = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ContentPreview = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 500;
  background: ${({ active, theme }) => active ? theme.colors.success + '20' : theme.colors.gray[200]};
  color: ${({ active, theme }) => active ? theme.colors.success : theme.colors.gray[600]};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.medium};
  background: ${({ variant, theme }) => 
    variant === 'danger' ? theme.colors.error + '10' : theme.colors.gray[100]};
  color: ${({ variant, theme }) => 
    variant === 'danger' ? theme.colors.error : theme.colors.gray[600]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ variant, theme }) => 
      variant === 'danger' ? theme.colors.error + '20' : theme.colors.gray[200]};
  }
`;

export default NotiTemplateCard; 