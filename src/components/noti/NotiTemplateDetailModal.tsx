import React from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import type { NotiTemplate } from '../../api/noti';

interface NotiTemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: NotiTemplate | null;
}

const NotiTemplateDetailModal: React.FC<NotiTemplateDetailModalProps> = ({
  isOpen,
  onClose,
  template
}) => {
  const generatePreview = (template: NotiTemplate) => {
    let titleHtml = template.titleTemplate;
    let contentHtml = template.contentTemplate;
    
    // 변수 치환
    Object.entries(template.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      titleHtml = titleHtml.replace(regex, value);
      contentHtml = contentHtml.replace(regex, value);
    });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">${titleHtml}</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">${contentHtml}</p>
          <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            이 메시지는 ${template.channelType}을(를) 통해 전송됩니다.
          </p>
        </div>
      </div>
    `;
  };

  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="템플릿 상세 정보"
      size="large"
    >
      <DetailModalContent>
        <DetailGrid>
          {/* Template Details */}
          <DetailSection>
            <SectionTitle>템플릿 상세</SectionTitle>
            <DetailFields>
              <DetailField>
                <DetailLabel>제목 템플릿</DetailLabel>
                <DetailTextarea
                  value={template.titleTemplate}
                  readOnly
                />
              </DetailField>
              
              <DetailRow>
                <DetailField>
                  <DetailLabel>기본 템플릿 여부</DetailLabel>
                  <DetailValue>{template.isDefault ? 'Yes' : 'No'}</DetailValue>
                </DetailField>
                <DetailField>
                  <DetailLabel>우선순위</DetailLabel>
                  <DetailValue>{template.priority}</DetailValue>
                </DetailField>
              </DetailRow>
              
              <DetailField>
                <DetailLabel>내용 템플릿</DetailLabel>
                <DetailTextarea
                  value={template.contentTemplate}
                  readOnly
                  rows={6}
                />
              </DetailField>
              
              <DetailField>
                <DetailLabel>변수</DetailLabel>
                <DetailCode>
                  {JSON.stringify(template.variables, null, 2)}
                </DetailCode>
              </DetailField>
              
              <DetailRow>
                <DetailField>
                  <DetailLabel>생성일</DetailLabel>
                  <DetailValue>{new Date(template.createdAt).toLocaleDateString()}</DetailValue>
                </DetailField>
                <DetailField>
                  <DetailLabel>수정일</DetailLabel>
                  <DetailValue>{new Date(template.updatedAt).toLocaleDateString()}</DetailValue>
                </DetailField>
              </DetailRow>
            </DetailFields>
          </DetailSection>
          
          {/* Preview */}
          <DetailSection>
            <SectionTitle>미리보기</SectionTitle>
            <PreviewContainer>
              <PreviewContent
                dangerouslySetInnerHTML={{ __html: generatePreview(template) }}
              />
            </PreviewContainer>
          </DetailSection>
        </DetailGrid>
      </DetailModalContent>
    </Modal>
  );
};

// Styled Components
const DetailModalContent = styled.div`
  padding: 24px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
`;

const DetailFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DetailField = styled.div``;

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const DetailLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const DetailTextarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.text.primary};
  resize: vertical;
  min-height: 80px;
`;

const DetailCode = styled.pre`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  padding: 12px;
  font-size: 13px;
  overflow: auto;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DetailValue = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const PreviewContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  overflow: hidden;
`;

const PreviewContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
`;

export default NotiTemplateDetailModal; 