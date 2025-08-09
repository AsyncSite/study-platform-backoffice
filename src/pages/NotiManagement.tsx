import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';
import { useNotification } from '../contexts/NotificationContext';
import { notiApi, type NotiTemplate, type CreateNotiTemplateRequest, type UpdateNotiTemplateRequest } from '../api/noti';
import {
  NotiFilters,
  NotiTemplateCard,
  NotiTemplateModal,
  NotiTemplateDetailModal
} from '../components/noti';

const NotiManagement: React.FC = () => {
  const { showToast, showConfirm } = useNotification();
  
  // State
  const [templates, setTemplates] = useState<NotiTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [channelTypes, setChannelTypes] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    eventType: "",
    channelType: ""
  });
  
  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState<NotiTemplate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form data
  const [newTemplate, setNewTemplate] = useState<CreateNotiTemplateRequest>({
    channelType: "",
    eventType: "",
    titleTemplate: "",
    contentTemplate: "",
    variables: {}
  });

  const [editTemplate, setEditTemplate] = useState<UpdateNotiTemplateRequest>({
    titleTemplate: "",
    contentTemplate: "",
    variables: {}
  });

  // Refresh all data
  const refreshAll = () => {
    loadTemplates();
    loadEventTypes();
    loadChannelTypes();
  };

  // Load templates and types on mount
  useEffect(() => {
    refreshAll();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // API에서는 channelType으로 필터링하므로, 전체를 가져오기 위해 빈 문자열 사용
      const response = await notiApi.getNotiTemplates("");
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        throw new Error(response.message || '템플릿 로드에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      showToast(error.message || '템플릿 로드에 실패했습니다.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      const response = await notiApi.getEventTypes();
      
      if (response.success && response.data) {
        setEventTypes(response.data);
      } else {
        throw new Error(response.message || '이벤트 타입 로드에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to load event types:', error);
      showToast(error.message || '이벤트 타입 로드에 실패했습니다.', { type: 'error' });
    }
  };

  const loadChannelTypes = async () => {
    try {
      const response = await notiApi.getChannelTypes();
      
      if (response.success && response.data) {
        setChannelTypes(response.data);
      } else {
        throw new Error(response.message || '채널 타입 로드에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to load channel types:', error);
      showToast(error.message || '채널 타입 로드에 실패했습니다.', { type: 'error' });
    }
  };

  const filteredTemplates = templates.filter(template => {
    return (
      (searchFilters.eventType === "" || template.eventType === searchFilters.eventType) &&
      (searchFilters.channelType === "" || template.channelType === searchFilters.channelType)
    );
  });



  const handleCreateTemplate = async () => {
    try {
      if (!newTemplate.titleTemplate || !newTemplate.eventType || !newTemplate.channelType || !newTemplate.contentTemplate) {
        showToast('모든 필수 필드를 입력해주세요.', { type: 'warning' });
        return;
      }

      const response = await notiApi.createNotiTemplate(newTemplate);
      
      if (response.success) {
        showToast('템플릿이 성공적으로 생성되었습니다.', { type: 'success' });
        setNewTemplate({
          channelType: "",
          eventType: "",
          titleTemplate: "",
          contentTemplate: "",
          variables: {}
        });
        setShowCreateModal(false);
        refreshAll(); // Reload all data
      } else {
        throw new Error(response.message || '템플릿 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to create template:', error);
      showToast(error.message || '템플릿 생성에 실패했습니다.', { type: 'error' });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await notiApi.updateNotiTemplate(selectedTemplate.templateId, editTemplate);
      
      if (response.success) {
        showToast('템플릿이 성공적으로 수정되었습니다.', { type: 'success' });
        setShowEditModal(false);
        setSelectedTemplate(null);
        refreshAll(); // Reload all data
      } else {
        throw new Error(response.message || '템플릿 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to update template:', error);
      showToast(error.message || '템플릿 수정에 실패했습니다.', { type: 'error' });
    }
  };

  const handleDeactivateTemplate = async (template: NotiTemplate) => {
    const confirmed = await showConfirm({
      title: '템플릿 비활성화',
      message: `"${template.titleTemplate}" 템플릿을 비활성화하시겠습니까?`,
      confirmText: '비활성화',
      cancelText: '취소',
      variant: 'warning'
    });

    if (!confirmed) return;

    try {
      const response = await notiApi.deactivateNotiTemplate(template.templateId);
      
      if (response.success) {
        showToast('템플릿이 비활성화되었습니다.', { type: 'success' });
        refreshAll(); // Reload all data
      } else {
        throw new Error(response.message || '템플릿 비활성화에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to deactivate template:', error);
      showToast(error.message || '템플릿 비활성화에 실패했습니다.', { type: 'error' });
    }
  };

  const handleViewTemplate = (template: NotiTemplate) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const handleEditTemplate = (template: NotiTemplate) => {
    setSelectedTemplate(template);
    setEditTemplate({
      titleTemplate: template.titleTemplate,
      contentTemplate: template.contentTemplate,
      variables: template.variables
    });
    setShowEditModal(true);
  };
     
  if (loading) {
    return (
      <Container>
        <LoadingWrapper>
          <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px' }} />
          <LoadingText>로딩 중...</LoadingText>
        </LoadingWrapper>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>알림 템플릿 관리</Title>
          <Subtitle>메일, 알림, 디스코드 메시지 템플릿을 관리합니다</Subtitle>
        </HeaderContent>
        <HeaderActions>
          <RefreshButton onClick={refreshAll} disabled={loading}>
            <RefreshCw 
              className={loading ? 'animate-spin' : ''} 
              style={{ width: '16px', height: '16px' }} 
            />
          </RefreshButton>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
                          <Plus style={{ width: '16px', height: '16px' }} />
            새 템플릿 추가
          </Button>
        </HeaderActions>
      </Header>

      {/* Filters */}
      <NotiFilters
        eventTypes={eventTypes}
        channelTypes={channelTypes}
        searchFilters={searchFilters}
        onFiltersChange={setSearchFilters}
      />

      {/* Template Grid */}
      <TemplatesSection>
        <SectionHeader>
          <TemplateCount>
            총 {filteredTemplates.length}개의 템플릿
          </TemplateCount>
        </SectionHeader>

        <TemplatesGrid>
          {filteredTemplates.map(template => (
            <NotiTemplateCard
              key={template.templateId}
              template={template}
              onView={handleViewTemplate}
              onEdit={handleEditTemplate}
              onDelete={handleDeactivateTemplate}
            />
          ))}
        </TemplatesGrid>

        {filteredTemplates.length === 0 && (
          <EmptyState>
            <p>조건에 맞는 템플릿이 없습니다.</p>
          </EmptyState>
        )}
      </TemplatesSection>

      {/* Detail Modal */}
      <NotiTemplateDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        template={selectedTemplate}
      />

            {/* Create Template Modal */}
      <NotiTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
        title="새 템플릿 추가"
        eventTypes={eventTypes}
        channelTypes={channelTypes}
        templateData={newTemplate}
        onTemplateChange={(data) => setNewTemplate(data as CreateNotiTemplateRequest)}
        isEdit={false}
      />

      {/* Edit Template Modal */}
      <NotiTemplateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateTemplate}
        title="템플릿 수정"
        eventTypes={eventTypes}
        channelTypes={channelTypes}
        templateData={editTemplate}
        onTemplateChange={(data) => setEditTemplate(data as UpdateNotiTemplateRequest)}
        isEdit={true}
      />
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingText = styled.span`
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
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

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const RefreshButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TemplatesSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TemplateCount = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 16px;
`;

export default NotiManagement;
