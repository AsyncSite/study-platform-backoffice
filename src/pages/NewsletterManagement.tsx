import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import RichTextEditor from '../components/editor/RichTextEditor';
import { newslettersApi, type Newsletter, type NewsletterStatus } from '../api/newsletters';
import { newsletterApi } from '../api/newsletter';

const NewsletterManagement: React.FC = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // 에디터 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 테스트 발송 모달
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testNewsletterId, setTestNewsletterId] = useState<number | null>(null);

  useEffect(() => {
    fetchNewsletters();
    fetchSubscriberCount();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const data = await newslettersApi.getAll();
      setNewsletters(data);
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const data = await newsletterApi.getSubscribers();
      setSubscriberCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch subscriber count:', error);
    }
  };

  const handleNew = () => {
    setEditingNewsletter(null);
    setTitle('');
    setContent('');
    setActiveTab('editor');
  };

  const handleEdit = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setTitle(newsletter.title);
    setContent(newsletter.content);
    setActiveTab('editor');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingNewsletter) {
        await newslettersApi.update(editingNewsletter.id, { title, content });
        alert('뉴스레터가 수정되었습니다.');
      } else {
        await newslettersApi.create({ title, content });
        alert('뉴스레터가 생성되었습니다.');
      }
      setActiveTab('list');
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await newslettersApi.delete(id);
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const openTestModal = (id: number) => {
    setTestNewsletterId(id);
    setTestEmail('');
    setShowTestModal(true);
  };

  const handleTestSend = async () => {
    if (!testEmail.trim() || !testNewsletterId) return;
    try {
      await newslettersApi.sendTest(testNewsletterId, { email: testEmail });
      alert('테스트 이메일이 발송되었습니다.');
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send test:', error);
      alert('테스트 발송에 실패했습니다.');
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm(`${subscriberCount}명의 구독자에게 뉴스레터를 발송하시겠습니까?`)) return;
    try {
      await newslettersApi.send(id);
      alert('뉴스레터가 발송되었습니다.');
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to send:', error);
      alert('발송에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status: NewsletterStatus) => {
    switch (status) {
      case 'DRAFT':
        return <StatusBadge $status="draft">작성 중</StatusBadge>;
      case 'SCHEDULED':
        return <StatusBadge $status="scheduled">예약됨</StatusBadge>;
      case 'SENT':
        return <StatusBadge $status="sent">발송 완료</StatusBadge>;
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>뉴스레터 관리</Title>
          <Description>
            뉴스레터를 작성하고 {subscriberCount}명의 구독자에게 발송합니다.
          </Description>
        </div>
        {activeTab === 'list' && (
          <AddButton onClick={handleNew}>+ 새 뉴스레터 작성</AddButton>
        )}
      </Header>

      {activeTab === 'list' ? (
        <>
          {loading ? (
            <LoadingText>로딩 중...</LoadingText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>호수</Th>
                  <Th>제목</Th>
                  <Th>상태</Th>
                  <Th>발송 대상</Th>
                  <Th>발송일</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {newsletters.map((newsletter) => (
                  <tr key={newsletter.id}>
                    <Td>#{newsletter.issueNumber}</Td>
                    <Td>
                      <NewsletterTitle onClick={() => handleEdit(newsletter)}>
                        {newsletter.title}
                      </NewsletterTitle>
                    </Td>
                    <Td>{getStatusBadge(newsletter.status)}</Td>
                    <Td>{newsletter.recipientCount > 0 ? `${newsletter.recipientCount}명` : '-'}</Td>
                    <Td>{formatDate(newsletter.sentAt)}</Td>
                    <Td>
                      <ActionButtons>
                        {newsletter.status === 'DRAFT' && (
                          <>
                            <ActionButton onClick={() => handleEdit(newsletter)}>
                              수정
                            </ActionButton>
                            <ActionButton onClick={() => openTestModal(newsletter.id)}>
                              테스트
                            </ActionButton>
                            <ActionButton $primary onClick={() => handleSend(newsletter.id)}>
                              발송
                            </ActionButton>
                            <ActionButton $danger onClick={() => handleDelete(newsletter.id)}>
                              삭제
                            </ActionButton>
                          </>
                        )}
                        {newsletter.status === 'SENT' && (
                          <ActionButton onClick={() => handleEdit(newsletter)}>
                            보기
                          </ActionButton>
                        )}
                      </ActionButtons>
                    </Td>
                  </tr>
                ))}
                {newsletters.length === 0 && (
                  <tr>
                    <Td colSpan={6}>
                      <EmptyText>작성된 뉴스레터가 없습니다.</EmptyText>
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </>
      ) : (
        <EditorContainer>
          <EditorHeader>
            <BackButton onClick={() => setActiveTab('list')}>
              ← 목록으로
            </BackButton>
            <EditorTitle>
              {editingNewsletter ? `#${editingNewsletter.issueNumber} 수정` : '새 뉴스레터 작성'}
            </EditorTitle>
          </EditorHeader>

          <FormGroup>
            <Label>제목</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="뉴스레터 제목을 입력하세요"
              disabled={editingNewsletter?.status === 'SENT'}
            />
          </FormGroup>

          <FormGroup>
            <Label>본문</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="뉴스레터 내용을 작성하세요..."
              disabled={editingNewsletter?.status === 'SENT'}
            />
          </FormGroup>

          {editingNewsletter?.status !== 'SENT' && (
            <EditorActions>
              <SaveButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </SaveButton>
              {editingNewsletter && (
                <>
                  <TestButton onClick={() => openTestModal(editingNewsletter.id)}>
                    테스트 발송
                  </TestButton>
                  <SendButton onClick={() => handleSend(editingNewsletter.id)}>
                    {subscriberCount}명에게 발송
                  </SendButton>
                </>
              )}
            </EditorActions>
          )}
        </EditorContainer>
      )}

      {/* 테스트 발송 모달 */}
      {showTestModal && (
        <ModalOverlay onClick={() => setShowTestModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>테스트 발송</ModalTitle>
              <CloseButton onClick={() => setShowTestModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>수신 이메일</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </FormGroup>
              <ModalActions>
                <CancelButton onClick={() => setShowTestModal(false)}>취소</CancelButton>
                <ConfirmButton onClick={handleTestSend}>발송</ConfirmButton>
              </ModalActions>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default NewsletterManagement;

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

const Description = styled.p`
  color: #666;
`;

const AddButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #4338ca;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
`;

const NewsletterTitle = styled.span`
  color: #4f46e5;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span<{ $status: 'draft' | 'scheduled' | 'sent' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  ${({ $status }) => {
    switch ($status) {
      case 'draft':
        return 'background: #fef3c7; color: #92400e;';
      case 'scheduled':
        return 'background: #dbeafe; color: #1e40af;';
      case 'sent':
        return 'background: #d1fae5; color: #065f46;';
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background: white;
  color: #374151;
  transition: all 0.2s;

  ${({ $primary }) =>
    $primary &&
    `
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;

    &:hover {
      background: #4338ca;
    }
  `}

  ${({ $danger }) =>
    $danger &&
    `
    color: #dc2626;
    border-color: #fecaca;

    &:hover {
      background: #fee2e2;
    }
  `}

  &:hover {
    background: #f3f4f6;
  }
`;

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 20px;
`;

// Editor styles
const EditorContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #374151;
  }
`;

const EditorTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const EditorActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const TestButton = styled.button`
  padding: 12px 24px;
  background: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #eef2ff;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #047857;
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;

  &:hover {
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }
`;
