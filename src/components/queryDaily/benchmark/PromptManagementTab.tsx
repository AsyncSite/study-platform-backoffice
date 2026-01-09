import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { benchmarkApi } from '../../../api/benchmark';
import type { PromptTemplate, PromptType, CreatePromptRequest, UpdatePromptRequest } from '../../../types/benchmark';

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  QUESTION_GENERATION: '질문 생성',
  EVALUATION: '평가',
};

const PromptManagementTab: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<CreatePromptRequest>({
    promptType: 'QUESTION_GENERATION',
    name: '',
    content: '',
    description: '',
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await benchmarkApi.getPrompts();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError('프롬프트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.content.trim()) {
      setError('프롬프트 내용을 입력해주세요.');
      return;
    }
    try {
      await benchmarkApi.createPrompt(formData);
      setShowCreateModal(false);
      setFormData({ promptType: 'QUESTION_GENERATION', name: '', content: '', description: '' });
      loadPrompts();
    } catch (err) {
      console.error('Failed to create prompt:', err);
      setError('프롬프트 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async () => {
    if (!editingPrompt) return;
    const updateData: UpdatePromptRequest = {
      name: formData.name,
      content: formData.content,
      description: formData.description,
    };
    try {
      await benchmarkApi.updatePrompt(editingPrompt.id, updateData);
      setShowEditModal(false);
      setEditingPrompt(null);
      loadPrompts();
    } catch (err) {
      console.error('Failed to update prompt:', err);
      setError('프롬프트 수정에 실패했습니다.');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await benchmarkApi.activatePrompt(id);
      loadPrompts();
    } catch (err) {
      console.error('Failed to activate prompt:', err);
      setError('프롬프트 활성화에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await benchmarkApi.deletePrompt(id);
      loadPrompts();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError('프롬프트 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setFormData({
      promptType: prompt.promptType,
      name: prompt.name,
      content: prompt.content,
      description: prompt.description,
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingPrompt(null);
    setFormData({ promptType: 'QUESTION_GENERATION', name: '', content: '', description: '' });
    setError(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const highlightVariables = (content: string) => {
    return content.split(/(\{\{[^}]+\}\})/).map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return <Variable key={index}>{part}</Variable>;
      }
      return part;
    });
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.promptType]) {
      acc[prompt.promptType] = [];
    }
    acc[prompt.promptType].push(prompt);
    return acc;
  }, {} as Record<PromptType, PromptTemplate[]>);

  return (
    <Container>
      <Header>
        <Title>프롬프트 관리</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>새 프롬프트 추가</CreateButton>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? (
        <LoadingText>로딩 중...</LoadingText>
      ) : (
        <>
          {(['QUESTION_GENERATION', 'EVALUATION'] as PromptType[]).map((type) => (
            <PromptSection key={type}>
              <SectionTitle>{PROMPT_TYPE_LABELS[type]}</SectionTitle>
              {groupedPrompts[type]?.length > 0 ? (
                <PromptGrid>
                  {groupedPrompts[type].map((prompt) => (
                    <PromptCard key={prompt.id} isActive={prompt.isActive}>
                      <CardHeader>
                        <VersionBadge>v{prompt.version}</VersionBadge>
                        <StatusBadge isActive={prompt.isActive}>
                          {prompt.isActive ? '활성' : '비활성'}
                        </StatusBadge>
                      </CardHeader>
                      <PromptName>{prompt.name || `프롬프트 #${prompt.id}`}</PromptName>
                      <PromptDescription>{prompt.description || '설명 없음'}</PromptDescription>
                      <ContentPreview>{highlightVariables(prompt.content.slice(0, 200))}...</ContentPreview>
                      <CardFooter>
                        <DateText>{formatDate(prompt.createdAt)}</DateText>
                        <ButtonGroup>
                          {!prompt.isActive && (
                            <ActionButton onClick={() => handleActivate(prompt.id)} variant="activate">
                              활성화
                            </ActionButton>
                          )}
                          <ActionButton onClick={() => openEditModal(prompt)} variant="edit">
                            수정
                          </ActionButton>
                          {!prompt.isActive && (
                            <ActionButton onClick={() => handleDelete(prompt.id)} variant="delete">
                              삭제
                            </ActionButton>
                          )}
                        </ButtonGroup>
                      </CardFooter>
                    </PromptCard>
                  ))}
                </PromptGrid>
              ) : (
                <EmptyState>등록된 프롬프트가 없습니다.</EmptyState>
              )}
            </PromptSection>
          ))}
        </>
      )}

      {(showCreateModal || showEditModal) && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{showCreateModal ? '새 프롬프트 추가' : '프롬프트 수정'}</ModalTitle>
              <CloseButton onClick={closeModal}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {showCreateModal && (
                <FormGroup>
                  <FormLabel>프롬프트 유형</FormLabel>
                  <FormSelect
                    value={formData.promptType}
                    onChange={(e) => setFormData({ ...formData, promptType: e.target.value as PromptType })}
                  >
                    <option value="QUESTION_GENERATION">질문 생성</option>
                    <option value="EVALUATION">평가</option>
                  </FormSelect>
                </FormGroup>
              )}
              <FormGroup>
                <FormLabel>이름</FormLabel>
                <FormInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="프롬프트 이름 (선택)"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>설명</FormLabel>
                <FormInput
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="프롬프트 설명 (선택)"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>내용</FormLabel>
                <VariableHint>
                  변수: {'{{resumeContext}}'}, {'{{questionNumber}}'}, {'{{previousTopics}}'} 등
                </VariableHint>
                <FormTextarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="프롬프트 내용을 입력하세요..."
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={closeModal}>취소</CancelButton>
              <SubmitButton onClick={showCreateModal ? handleCreate : handleUpdate}>
                {showCreateModal ? '추가' : '저장'}
              </SubmitButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
`;

const CreateButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

const PromptSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const PromptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
`;

const PromptCard = styled.div<{ isActive: boolean }>`
  padding: 16px;
  border: 2px solid ${(props) => (props.isActive ? '#22c55e' : '#e5e7eb')};
  border-radius: 8px;
  background: ${(props) => (props.isActive ? '#f0fdf4' : 'white')};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const VersionBadge = styled.span`
  padding: 4px 8px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ isActive: boolean }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${(props) => (props.isActive ? '#d1fae5' : '#f3f4f6')};
  color: ${(props) => (props.isActive ? '#065f46' : '#6b7280')};
`;

const PromptName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
`;

const PromptDescription = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
`;

const ContentPreview = styled.div`
  font-size: 12px;
  color: #4b5563;
  line-height: 1.5;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 12px;
  max-height: 80px;
  overflow: hidden;
  font-family: 'Consolas', 'Monaco', monospace;
`;

const Variable = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const DateText = styled.span`
  font-size: 11px;
  color: #9ca3af;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button<{ variant: 'activate' | 'edit' | 'delete' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    switch (props.variant) {
      case 'activate':
        return `
          background: #d1fae5;
          color: #065f46;
          &:hover { background: #a7f3d0; }
        `;
      case 'edit':
        return `
          background: #dbeafe;
          color: #1d4ed8;
          &:hover { background: #bfdbfe; }
        `;
      case 'delete':
        return `
          background: #fef2f2;
          color: #dc2626;
          &:hover { background: #fecaca; }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const VariableHint = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 4px;
`;

const FormTextarea = styled.textarea`
  width: 100%;
  height: 800px;
  padding: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
`;

export default PromptManagementTab;
