import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StudyManagementTabs, { type StudyTab } from '../components/study/StudyManagementTabs';
import PendingStudiesTab from '../components/study/PendingStudiesTab';
import ActiveStudiesTab from '../components/study/ActiveStudiesTab';
import InactiveStudiesTab from '../components/study/InactiveStudiesTab';
import StudyDetailModal from '../components/study/StudyDetailModal';
import StudyRejectModal from '../components/study/StudyRejectModal';
import StudyApplicationsModal from '../components/study/StudyApplicationsModal';
import AdminStudyCreateModal from '../components/study/AdminStudyCreateModal';
import type { StudyResponse, StudyCreateRequest } from '../types/api';
import { StudyStatus } from '../types/api';
import { studyApi } from '../api/study';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, RefreshCw } from 'lucide-react';

const StudyManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useNotification();
  
  // State
  const [activeTab, setActiveTab] = useState<StudyTab>('PENDING');
  const [studies, setStudies] = useState<StudyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudyResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [studyToReject, setStudyToReject] = useState<StudyResponse | null>(null);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false);
  const [applicationStudy, setApplicationStudy] = useState<StudyResponse | null>(null);

  // Load studies on mount and when showDeleted changes
  useEffect(() => {
    loadStudies();
  }, [showDeleted]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const response = showDeleted 
        ? await studyApi.getPagedStudiesIncludingDeleted(0, 100, 'createdAt,desc')
        : await studyApi.getPagedStudies(0, 100, 'createdAt,desc');
      
      setStudies(response.content);
    } catch (error) {
      console.error('Failed to load studies:', error);
      showToast('스터디 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter studies by tab
  const getFilteredStudies = () => {
    switch (activeTab) {
      case 'PENDING':
        return studies.filter(s => s.status === StudyStatus.PENDING);
      case 'ACTIVE':
        return studies.filter(s => s.status === StudyStatus.APPROVED || s.status === StudyStatus.IN_PROGRESS);
      case 'INACTIVE':
        return studies.filter(s => s.status === StudyStatus.TERMINATED || s.status === StudyStatus.REJECTED);
      default:
        return [];
    }
  };

  // Study actions
  const handleApprove = async (id: string) => {
    try {
      await studyApi.approveStudy(id);
      await loadStudies();
      showToast('스터디가 승인되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to approve study:', error);
      showToast('스터디 승인에 실패했습니다.', 'error');
    }
  };

  const handleReject = (id: string) => {
    const study = studies.find(s => s.id === id);
    if (study) {
      setStudyToReject(study);
      setIsRejectModalOpen(true);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!studyToReject) return;
    
    try {
      await studyApi.rejectStudy(studyToReject.id, reason);
      await loadStudies();
      setIsRejectModalOpen(false);
      setStudyToReject(null);
      showToast('스터디가 거절되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to reject study:', error);
      showToast('스터디 거절에 실패했습니다.', 'error');
    }
  };

  const handleTerminate = async (id: string) => {
    const study = studies.find(s => s.id === id);
    if (!study) return;
    
    const confirmed = await showConfirm({
      title: '스터디 종료',
      message: `"${study.title}" 스터디를 정말 종료하시겠습니까?\n\n종료된 스터디는 더 이상 새로운 지원을 받을 수 없습니다.`,
      confirmText: '종료',
      variant: 'warning'
    });
    
    if (!confirmed) return;
    
    try {
      await studyApi.terminateStudy(id);
      await loadStudies();
      showToast('스터디가 종료되었습니다.', 'success');
    } catch (error: any) {
      console.error('Failed to terminate study:', error);
      const errorMessage = error.response?.data?.error?.message || '스터디 종료에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  const handleReactivate = async (id: string) => {
    const study = studies.find(s => s.id === id);
    if (!study) return;
    
    const confirmed = await showConfirm({
      title: '스터디 재활성화',
      message: `"${study.title}" 스터디를 재활성화하시겠습니까?\n\n종료된 스터디가 다시 활성화되어 새로운 지원을 받을 수 있게 됩니다.`,
      confirmText: '재활성화',
      variant: 'info'
    });
    
    if (!confirmed) return;
    
    try {
      await studyApi.reactivateStudy(id);
      await loadStudies();
      showToast('스터디가 재활성화되었습니다.', 'success');
    } catch (error: any) {
      console.error('Failed to reactivate study:', error);
      const errorMessage = error.response?.data?.error?.message || '스터디 재활성화에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const study = studies.find(s => s.id === id);
    if (!study) return;
    
    const confirmed = await showConfirm({
      title: '스터디 삭제',
      message: `"${study.title}" 스터디를 영구적으로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await studyApi.deleteStudy(id);
      await loadStudies();
      showToast('스터디가 삭제되었습니다.', 'success');
    } catch (error: any) {
      console.error('Failed to delete study:', error);
      const errorMessage = error.response?.data?.error?.message || '스터디 삭제에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  const handleView = (id: string) => {
    const study = studies.find(s => s.id === id);
    if (study) {
      setSelectedStudy(study);
      setIsDetailModalOpen(true);
    }
  };

  const handleManageApplications = (study: StudyResponse) => {
    setApplicationStudy(study);
    setIsApplicationsModalOpen(true);
  };

  const handleCreateStudy = async (data: StudyCreateRequest) => {
    try {
      await studyApi.createStudy(data);
      await loadStudies();
      setIsCreateModalOpen(false);
      showToast('스터디가 생성되었습니다. 관리자 권한으로 생성된 스터디는 즉시 활성화됩니다.', 'success');
    } catch (error) {
      console.error('Failed to create study:', error);
      showToast('스터디 생성에 실패했습니다.', 'error');
      throw error;
    }
  };

  // Count studies by status
  const pendingCount = studies.filter(s => s.status === StudyStatus.PENDING).length;
  const activeCount = studies.filter(s => s.status === StudyStatus.APPROVED || s.status === StudyStatus.IN_PROGRESS).length;
  const inactiveCount = studies.filter(s => s.status === StudyStatus.TERMINATED || s.status === StudyStatus.REJECTED).length;

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>스터디 관리</Title>
          <Description>
            모든 스터디의 생성, 승인, 참여 신청을 통합 관리합니다.
          </Description>
        </HeaderContent>
        <HeaderActions>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? '활성 스터디만' : '삭제된 스터디 포함'}
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} />
            관리자 스터디 생성
          </Button>
          <RefreshButton onClick={loadStudies}>
            <RefreshCw size={20} />
          </RefreshButton>
        </HeaderActions>
      </Header>

      <MainCard>
        <StudyManagementTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />

        {activeTab === 'PENDING' && (
          <PendingStudiesTab
            studies={getFilteredStudies()}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={handleView}
          />
        )}

        {activeTab === 'ACTIVE' && (
          <ActiveStudiesTab
            studies={getFilteredStudies()}
            loading={loading}
            onTerminate={handleTerminate}
            onView={handleView}
            onManageApplications={handleManageApplications}
          />
        )}

        {activeTab === 'INACTIVE' && (
          <InactiveStudiesTab
            studies={getFilteredStudies()}
            loading={loading}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
            onView={handleView}
          />
        )}
      </MainCard>

      {/* Modals */}
      <AdminStudyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStudy}
      />

      <StudyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudy(null);
        }}
        study={selectedStudy}
        onApprove={async (id) => {
          await handleApprove(id);
          setIsDetailModalOpen(false);
          setSelectedStudy(null);
        }}
        onReject={(id) => {
          handleReject(id);
          setIsDetailModalOpen(false);
          setSelectedStudy(null);
        }}
        onTerminate={async (id) => {
          await handleTerminate(id);
          setIsDetailModalOpen(false);
          setSelectedStudy(null);
        }}
        onReactivate={async (id) => {
          await handleReactivate(id);
          setIsDetailModalOpen(false);
          setSelectedStudy(null);
        }}
      />

      <StudyRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setStudyToReject(null);
        }}
        onReject={handleRejectConfirm}
        studyTitle={studyToReject?.title || ''}
      />

      <StudyApplicationsModal
        isOpen={isApplicationsModalOpen}
        onClose={() => {
          setIsApplicationsModalOpen(false);
          setApplicationStudy(null);
        }}
        study={applicationStudy}
      />
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
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
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MainCard = styled(Card)`
  padding: 32px;
`;

export default StudyManagement;