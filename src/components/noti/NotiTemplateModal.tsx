import React from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import Button from '../common/Button';
import NotiVariableManager from './NotiVariableManager';
import type { CreateNotiTemplateRequest, UpdateNotiTemplateRequest } from '../../api/noti';

interface NotiTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  eventTypes: string[];
  channelTypes: string[];
  templateData: CreateNotiTemplateRequest | UpdateNotiTemplateRequest;
  onTemplateChange: (data: CreateNotiTemplateRequest | UpdateNotiTemplateRequest) => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

const NotiTemplateModal: React.FC<NotiTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  eventTypes,
  channelTypes,
  templateData,
  onTemplateChange,
  isEdit = false,
  isSubmitting = false
}) => {
  const isCreateTemplate = 'eventType' in templateData && 'channelType' in templateData;

  const handleTitleChange = (value: string) => {
    onTemplateChange({ ...templateData, titleTemplate: value });
  };

  const handleContentChange = (value: string) => {
    onTemplateChange({ ...templateData, contentTemplate: value });
  };

  const handleEventTypeChange = (value: string) => {
    if (isCreateTemplate) {
      onTemplateChange({ 
        ...templateData as CreateNotiTemplateRequest, 
        eventType: value 
      });
    }
  };

  const handleChannelTypeChange = (value: string) => {
    if (isCreateTemplate) {
      onTemplateChange({ 
        ...templateData as CreateNotiTemplateRequest, 
        channelType: value 
      });
    }
  };

  const handleVariablesChange = (variables: Record<string, string>) => {
    onTemplateChange({ ...templateData, variables });
  };

  const isValid = () => {
    if (!templateData.titleTemplate || !templateData.contentTemplate) {
      return false;
    }
    
    if (isCreateTemplate) {
      const createData = templateData as CreateNotiTemplateRequest;
      return !!(createData.eventType && createData.channelType);
    }
    
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >
      <ModalContent>
        <FormFields>
          <FormField>
            <Label>제목 템플릿 *</Label>
            <Input
              type="text"
              value={templateData.titleTemplate}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="템플릿 제목을 입력하세요"
            />
          </FormField>
          
          {isCreateTemplate && (
            <FormRow>
              <FormField>
                <Label>Event Type *</Label>
                <Select
                  value={(templateData as CreateNotiTemplateRequest).eventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </FormField>
              
              <FormField>
                <Label>Channel Type *</Label>
                <Select
                  value={(templateData as CreateNotiTemplateRequest).channelType}
                  onChange={(e) => handleChannelTypeChange(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {channelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </FormField>
            </FormRow>
          )}
          
          <FormField>
            <Label>내용 템플릿 *</Label>
            <Textarea
              value={templateData.contentTemplate}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="템플릿 내용을 입력하세요. {변수명} 형태로 변수를 사용할 수 있습니다."
              rows={6}
            />
          </FormField>
          
          {/* 변수 관리 */}
          <FormField>
            <NotiVariableManager
              variables={templateData.variables}
              onVariablesChange={handleVariablesChange}
            />
          </FormField>
        </FormFields>
        
        <ModalActions>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!isValid() || isSubmitting}
          >
            {isSubmitting ? '처리 중...' : (isEdit ? '수정' : '추가')}
          </Button>
        </ModalActions>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalContent = styled.div`
  padding: 24px;
`;

const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
`;

const FormField = styled.div``;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: ${({ theme }) => theme.transitions.fast};
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export default NotiTemplateModal; 