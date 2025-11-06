import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from '../components/common/Card';
import CompanyEmailDetailModal from '../components/queryDailyMobile/CompanyEmailDetailModal';
import CompanyEmailRejectModal from '../components/queryDailyMobile/CompanyEmailRejectModal';
import type { CompanyEmailVerification, CompanyEmailTab } from '../types/queryDailyMobile';
import { queryDailyMobileApi } from '../api/queryDailyMobile';
import { useNotification } from '../contexts/NotificationContext';
import { RefreshCw, Mail } from 'lucide-react';

const QueryDailyMobileManagement: React.FC = () => {
  const { showToast, showConfirm } = useNotification();

  // State
  const [activeTab, setActiveTab] = useState<CompanyEmailTab>('PENDING');
  const [verifications, setVerifications] = useState<CompanyEmailVerification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedVerification, setSelectedVerification] = useState<CompanyEmailVerification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [verificationToReject, setVerificationToReject] = useState<CompanyEmailVerification | null>(null);

  // Load verifications on mount and when tab changes
  useEffect(() => {
    loadVerifications();
  }, [activeTab]);

  const loadVerifications = async () => {
    try {
      setLoading(true);

      let response;
      if (activeTab === 'PENDING') {
        response = await queryDailyMobileApi.getPendingVerifications();
        setVerifications(response?.pendingVerifications || []);
      } else if (activeTab === 'APPROVED') {
        response = await queryDailyMobileApi.getApprovedVerifications();
        setVerifications(response?.approvedVerifications || []);
      } else if (activeTab === 'REJECTED') {
        response = await queryDailyMobileApi.getRejectedVerifications();
        setVerifications(response?.rejectedVerifications || []);
      }
    } catch (error: any) {
      console.error('Failed to load company email verifications:', error);
      console.error('Error details:', error.response);

      // Don't show error toast if it's a 401 (will be handled by interceptor)
      if (error.response?.status !== 401) {
        showToast('회사 이메일 인증 목록을 불러오는데 실패했습니다.', { type: 'error' });
      }
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Verification actions
  const handleApprove = async (verificationId: string) => {
    const verification = verifications.find(v => v.verificationId === verificationId);
    if (!verification) return;

    const confirmed = await showConfirm({
      title: '회사 이메일 승인',
      message: `${verification.companyName} - ${verification.companyEmail}\n\n해당 회사 이메일 인증을 승인하시겠습니까?`,
      confirmText: '승인',
      variant: 'info'
    });

    if (!confirmed) return;

    try {
      await queryDailyMobileApi.approveVerification(verificationId);
      await loadVerifications();
      showToast('회사 이메일이 승인되었습니다.', { type: 'success' });
    } catch (error) {
      console.error('Failed to approve verification:', error);
      showToast('회사 이메일 승인에 실패했습니다.', { type: 'error' });
    }
  };

  const handleReject = (verificationId: string) => {
    const verification = verifications.find(v => v.verificationId === verificationId);
    if (verification) {
      setVerificationToReject(verification);
      setIsRejectModalOpen(true);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!verificationToReject) return;

    try {
      await queryDailyMobileApi.rejectVerification(verificationToReject.verificationId, reason);
      await loadVerifications();
      setIsRejectModalOpen(false);
      setVerificationToReject(null);
      showToast('회사 이메일이 거절되었습니다.', { type: 'success' });
    } catch (error) {
      console.error('Failed to reject verification:', error);
      showToast('회사 이메일 거절에 실패했습니다.', { type: 'error' });
    }
  };

  const handleView = (verificationId: string) => {
    const verification = verifications.find(v => v.verificationId === verificationId);
    if (verification) {
      setSelectedVerification(verification);
      setIsDetailModalOpen(true);
    }
  };

  // Count verifications by status
  const pendingCount = activeTab === 'PENDING' ? verifications.length : 0;
  const approvedCount = activeTab === 'APPROVED' ? verifications.length : 0;
  const rejectedCount = activeTab === 'REJECTED' ? verifications.length : 0;

  return (
    <Container>
      <Header>
        <HeaderContent>
          <TitleSection>
            <Title>
              <Mail size={32} />
              QueryDaily Mobile - 회사 이메일 관리
            </Title>
            <Description>
              QueryDaily Mobile 사용자의 회사 이메일 인증을 관리합니다.
            </Description>
          </TitleSection>

          {/* Tabs */}
          <TabsContainer>
            <Tab
              $active={activeTab === 'PENDING'}
              onClick={() => setActiveTab('PENDING')}
            >
              승인 대기
              <Badge>{pendingCount}</Badge>
            </Tab>
            <Tab
              $active={activeTab === 'APPROVED'}
              onClick={() => setActiveTab('APPROVED')}
            >
              승인됨
              <Badge $variant="success">{approvedCount}</Badge>
            </Tab>
            <Tab
              $active={activeTab === 'REJECTED'}
              onClick={() => setActiveTab('REJECTED')}
            >
              거절됨
              <Badge $variant="error">{rejectedCount}</Badge>
            </Tab>
          </TabsContainer>
        </HeaderContent>

        <HeaderActions>
          <RefreshButton onClick={loadVerifications}>
            <RefreshCw size={20} />
          </RefreshButton>
        </HeaderActions>
      </Header>

      <MainCard>
        {activeTab === 'PENDING' && (
          <PendingContent
            verifications={verifications}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={handleView}
          />
        )}

        {activeTab === 'APPROVED' && (
          <ApprovedContent
            verifications={verifications}
            loading={loading}
            onView={handleView}
          />
        )}

        {activeTab === 'REJECTED' && (
          <RejectedContent
            verifications={verifications}
            loading={loading}
            onView={handleView}
          />
        )}
      </MainCard>

      {/* Detail Modal */}
      <CompanyEmailDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedVerification(null);
        }}
        verification={selectedVerification}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Reject Modal */}
      <CompanyEmailRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setVerificationToReject(null);
        }}
        onReject={handleRejectConfirm}
        companyEmail={verificationToReject?.companyEmail || ''}
        companyName={verificationToReject?.companyName || ''}
      />
    </Container>
  );
};

// Temporary PendingContent component (will be extracted later)
const PendingContent: React.FC<{
  verifications: CompanyEmailVerification[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
}> = ({ verifications, loading, onApprove, onReject, onView }) => {
  if (loading) {
    return <LoadingText>로딩 중...</LoadingText>;
  }

  if (verifications.length === 0) {
    return <EmptyText>승인 대기 중인 회사 이메일이 없습니다.</EmptyText>;
  }

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>회사명</Th>
            <Th>회사 이메일</Th>
            <Th>사용자 ID</Th>
            <Th>인증 요청 시각</Th>
            <Th>코드 인증 시각</Th>
            <Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v) => (
            <tr key={v.verificationId}>
              <Td>{v.companyName}</Td>
              <Td>{v.companyEmail}</Td>
              <Td>{v.userId}</Td>
              <Td>{new Date(v.createdAt).toLocaleString()}</Td>
              <Td>{new Date(v.verifiedAt).toLocaleString()}</Td>
              <Td>
                <ActionButtons>
                  <ActionButton
                    $variant="view"
                    onClick={() => onView(v.verificationId)}
                  >
                    보기
                  </ActionButton>
                  <ActionButton
                    $variant="approve"
                    onClick={() => onApprove(v.verificationId)}
                  >
                    승인
                  </ActionButton>
                  <ActionButton
                    $variant="reject"
                    onClick={() => onReject(v.verificationId)}
                  >
                    거절
                  </ActionButton>
                </ActionButtons>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

// ApprovedContent component
const ApprovedContent: React.FC<{
  verifications: CompanyEmailVerification[];
  loading: boolean;
  onView: (id: string) => void;
}> = ({ verifications, loading, onView }) => {
  if (loading) {
    return <LoadingText>로딩 중...</LoadingText>;
  }

  if (verifications.length === 0) {
    return <EmptyText>승인된 회사 이메일이 없습니다.</EmptyText>;
  }

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>회사명</Th>
            <Th>회사 이메일</Th>
            <Th>사용자 ID</Th>
            <Th>승인 날짜</Th>
            <Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v) => (
            <tr key={v.verificationId}>
              <Td>{v.companyName}</Td>
              <Td>{v.companyEmail}</Td>
              <Td>{v.userId}</Td>
              <Td>{new Date(v.verifiedAt).toLocaleString()}</Td>
              <Td>
                <ActionButtons>
                  <ActionButton
                    $variant="view"
                    onClick={() => onView(v.verificationId)}
                  >
                    보기
                  </ActionButton>
                </ActionButtons>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

// RejectedContent component
const RejectedContent: React.FC<{
  verifications: CompanyEmailVerification[];
  loading: boolean;
  onView: (id: string) => void;
}> = ({ verifications, loading, onView }) => {
  if (loading) {
    return <LoadingText>로딩 중...</LoadingText>;
  }

  if (verifications.length === 0) {
    return <EmptyText>거절된 회사 이메일이 없습니다.</EmptyText>;
  }

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>회사명</Th>
            <Th>회사 이메일</Th>
            <Th>사용자 ID</Th>
            <Th>거절 날짜</Th>
            <Th>거절 사유</Th>
            <Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v) => (
            <tr key={v.verificationId}>
              <Td>{v.companyName}</Td>
              <Td>{v.companyEmail}</Td>
              <Td>{v.userId}</Td>
              <Td>{new Date(v.verifiedAt).toLocaleString()}</Td>
              <Td>{v.rejectedReason || v.rejectionReason || '관리자에 의해 거절됨'}</Td>
              <Td>
                <ActionButtons>
                  <ActionButton
                    $variant="view"
                    onClick={() => onView(v.verificationId)}
                  >
                    보기
                  </ActionButton>
                </ActionButtons>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]}05;
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}08 0%, ${({ theme }) => theme.colors.primary}03 100%);
  border: 1px solid ${({ theme }) => theme.colors.primary}15;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: ${({ theme }) => theme.shadows.medium};

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 24px;
    margin-bottom: 20px;
  }
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 12px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary + '10' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.text.secondary};
  font-size: 15px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Badge = styled.span<{ $variant?: 'success' | 'error' }>`
  background: ${({ $variant, theme }) =>
    $variant === 'success' ? theme.colors.success + '20' :
    $variant === 'error' ? theme.colors.error + '20' :
    theme.colors.primary + '20'};
  color: ${({ $variant, theme }) =>
    $variant === 'success' ? theme.colors.success :
    $variant === 'error' ? theme.colors.error :
    theme.colors.primary};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const RefreshButton = styled.button`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({ theme }) => theme.shadows.small};

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: rotate(90deg);
  }
`;

const MainCard = styled(Card)`
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.large};
  border: 1px solid ${({ theme }) => theme.colors.border};

  /* 내부 컨텐츠에 패딩 적용 */
  > * {
    padding: 32px;
  }

  @media (max-width: 768px) {
    > * {
      padding: 24px;
    }
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 14px;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant: 'view' | 'approve' | 'reject' }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'view':
        return `
          background: ${theme.colors.gray[100]};
          color: ${theme.colors.text.primary};
          &:hover {
            background: ${theme.colors.gray[200]};
          }
        `;
      case 'approve':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
          &:hover {
            background: ${theme.colors.success}25;
          }
        `;
      case 'reject':
        return `
          background: ${theme.colors.error}15;
          color: ${theme.colors.error};
          &:hover {
            background: ${theme.colors.error}25;
          }
        `;
    }
  }}
`;

export default QueryDailyMobileManagement;
