import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { applicationApi } from '../../api/study';
import { useNotification } from '../../contexts/NotificationContext';
import type { StudyResponse, ApplicationResponse } from '../../types/api';
import { ApplicationStatus } from '../../types/api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

interface StudyApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: StudyResponse | null;
}

const StudyApplicationsModal: React.FC<StudyApplicationsModalProps> = ({
  isOpen,
  onClose,
  study,
}) => {
  const { showToast, showConfirm } = useNotification();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('PENDING');

  useEffect(() => {
    if (isOpen && study) {
      loadApplications();
    }
  }, [isOpen, study]);

  const loadApplications = async () => {
    if (!study) return;

    try {
      setLoading(true);
      const response = await applicationApi.getApplications(study.id);
      if (response.data) {
        setApplications(response.data.content);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
      showToast('참여 신청 목록을 불러오는데 실패했습니다.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId: string) => {
    if (!study) return;

    const confirmed = await showConfirm({
      title: '참여 신청 승인',
      message: '이 참여 신청을 승인하시겠습니까?',
      confirmText: '승인',
      cancelText: '취소',
      variant: 'info'
    });

    if (!confirmed) return;

    try {
      await applicationApi.acceptApplication(study.id, applicationId, {
        reviewerId: 'admin', // TODO: Get actual reviewer ID from auth context
        note: '참여 신청이 승인되었습니다. 환영합니다!'
      });
      showToast('참여 신청이 승인되었습니다.', { type: 'success' });
      loadApplications();
    } catch (error) {
      console.error('Failed to accept application:', error);
      showToast('참여 신청 승인에 실패했습니다.', { type: 'error' });
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!study) return;

    const confirmed = await showConfirm({
      title: '참여 신청 거절',
      message: '이 참여 신청을 거절하시겠습니까?',
      confirmText: '거절',
      cancelText: '취소',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await applicationApi.rejectApplication(study.id, applicationId, {
        reviewerId: 'admin', // TODO: Get actual reviewer ID from auth context
        reason: '죄송합니다. 현재 모집이 마감되었습니다.'
      });
      showToast('참여 신청이 거절되었습니다.', { type: 'success' });
      loadApplications();
    } catch (error) {
      console.error('Failed to reject application:', error);
      showToast('참여 신청 거절에 실패했습니다.', { type: 'error' });
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'ALL' || app.status === filter
  );

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING: return <Clock size={16} />;
      case ApplicationStatus.ACCEPTED: return <CheckCircle size={16} />;
      case ApplicationStatus.REJECTED: return <XCircle size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING: return 'warning';
      case ApplicationStatus.ACCEPTED: return 'success';
      case ApplicationStatus.REJECTED: return 'danger';
      default: return 'secondary';
    }
  };

  if (!study) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`"${study.title}" 참여 신청 관리`}
      size="large"
    >
      <Container>
        <FilterTabs>
          <FilterTab
            $active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
          >
            전체 ({applications.length})
          </FilterTab>
          <FilterTab
            $active={filter === 'PENDING'}
            onClick={() => setFilter('PENDING')}
          >
            대기 중 ({applications.filter(a => a.status === ApplicationStatus.PENDING).length})
          </FilterTab>
          <FilterTab
            $active={filter === 'ACCEPTED'}
            onClick={() => setFilter('ACCEPTED')}
          >
            승인됨 ({applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length})
          </FilterTab>
          <FilterTab
            $active={filter === 'REJECTED'}
            onClick={() => setFilter('REJECTED')}
          >
            거절됨 ({applications.filter(a => a.status === ApplicationStatus.REJECTED).length})
          </FilterTab>
        </FilterTabs>

        {loading ? (
          <LoadingMessage>참여 신청을 불러오는 중...</LoadingMessage>
        ) : filteredApplications.length === 0 ? (
          <EmptyMessage>
            {filter === 'ALL' ? '참여 신청이 없습니다.' : `${filter === 'PENDING' ? '대기 중인' : filter === 'ACCEPTED' ? '승인된' : '거절된'} 참여 신청이 없습니다.`}
          </EmptyMessage>
        ) : (
          <ApplicationList>
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id}>
                <ApplicationHeader>
                  <ApplicantInfo>
                    <User size={20} />
                    <div>
                      <ApplicantName>{application.applicantId}</ApplicantName>
                      <ApplicantDate>
                        {format(new Date(application.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </ApplicantDate>
                    </div>
                  </ApplicantInfo>
                  <StatusBadge $status={getStatusColor(application.status)}>
                    {getStatusIcon(application.status)}
                    {application.status === ApplicationStatus.PENDING && '대기 중'}
                    {application.status === ApplicationStatus.ACCEPTED && '승인됨'}
                    {application.status === ApplicationStatus.REJECTED && '거절됨'}
                  </StatusBadge>
                </ApplicationHeader>

                {application.answers && Object.keys(application.answers).length > 0 && (
                  <>
                    {Object.entries(application.answers).map(([question, answer]) => (
                      <ApplicationContent key={question}>
                        <ContentLabel>
                          <FileText size={16} />
                          {question}
                        </ContentLabel>
                        <ContentText>{answer}</ContentText>
                      </ApplicationContent>
                    ))}
                  </>
                )}

                {application.status === ApplicationStatus.PENDING && (
                  <ActionButtons>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleAccept(application.id)}
                    >
                      승인
                    </Button>
                    <Button
                      variant="error"
                      size="small"
                      onClick={() => handleReject(application.id)}
                    >
                      거절
                    </Button>
                  </ActionButtons>
                )}
              </ApplicationCard>
            ))}
          </ApplicationList>
        )}
      </Container>
    </Modal>
  );
};

const Container = styled.div`
  min-height: 400px;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => 
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.text.secondary};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ApplicationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ApplicationCard = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ApplicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const ApplicantInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;

  svg {
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-top: 2px;
  }
`;

const ApplicantName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ApplicantDate = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ theme, $status }) => {
    switch ($status) {
      case 'success': return theme.colors.success + '10';
      case 'danger': return theme.colors.danger + '10';
      case 'warning': return theme.colors.warning + '10';
      default: return theme.colors.secondary + '10';
    }
  }};
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  }};
`;

const ApplicationContent = styled.div`
  margin-bottom: 16px;
`;

const ContentLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;

  svg {
    color: ${({ theme }) => theme.colors.text.disabled};
  }
`;

const ContentText = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background};
  padding: 12px;
  border-radius: 6px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

export default StudyApplicationsModal;