import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { applicationApi } from '../../api/study';
import { useNotification } from '../../contexts/NotificationContext';
import type { StudyResponse, ApplicationResponse } from '../../types/api';
import { ApplicationStatus } from '../../types/api';
import { User, Clock, CheckCircle, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import {formatDate} from "../../utils/dateUtils.ts";

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
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

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
      if (response?.data?.content) {
        setApplications(response.data.content);
      } else if (response?.data && Array.isArray(response.data)) {
        // 배열 형태로 직접 응답이 올 경우 대비
        setApplications(response.data);
      } else {
        setApplications([]);
      }
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      // 404는 참여 신청이 없다는 의미이므로 에러 토스트 표시하지 않음
      if (error.response?.status !== 404) {
        showToast('참여 신청 목록을 불러오는데 실패했습니다.', { type: 'error' });
      }
      setApplications([]);
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

  const filteredApplications = (applications || []).filter(app => {
    if (!app) return false;
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return app.status === ApplicationStatus.PENDING || !app.status;
    return app.status === filter;
  });

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

  const toggleApplicationExpanded = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  if (!study) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="large"
    >
      <Container>
        {/* Header */}
        <HeaderSection>
          <TitleSection>
            <ModalTitle>참여 신청 관리</ModalTitle>
            <StudyTitle>"{study.title}"</StudyTitle>
          </TitleSection>
          <StatsSummary>
            <StatItem>
              <StatValue>{applications?.length || 0}</StatValue>
              <StatLabel>전체 신청</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{applications?.filter(a => a?.status === ApplicationStatus.PENDING || !a?.status).length || 0}</StatValue>
              <StatLabel>대기 중</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{applications?.filter(a => a?.status === ApplicationStatus.ACCEPTED).length || 0}</StatValue>
              <StatLabel>승인됨</StatLabel>
            </StatItem>
          </StatsSummary>
        </HeaderSection>

        {/* Filter Tabs */}
        <FilterSection>
          <FilterTabs>
            <FilterTab
              $active={filter === 'ALL'}
              onClick={() => setFilter('ALL')}
            >
              전체 <TabCount>{applications?.length || 0}</TabCount>
            </FilterTab>
            <FilterTab
              $active={filter === 'PENDING'}
              onClick={() => setFilter('PENDING')}
            >
              대기 중 <TabCount>{applications?.filter(a => a?.status === ApplicationStatus.PENDING || !a?.status).length || 0}</TabCount>
            </FilterTab>
            <FilterTab
              $active={filter === 'ACCEPTED'}
              onClick={() => setFilter('ACCEPTED')}
            >
              승인됨 <TabCount>{applications?.filter(a => a?.status === ApplicationStatus.ACCEPTED).length || 0}</TabCount>
            </FilterTab>
            <FilterTab
              $active={filter === 'REJECTED'}
              onClick={() => setFilter('REJECTED')}
            >
              거절됨 <TabCount>{applications?.filter(a => a?.status === ApplicationStatus.REJECTED).length || 0}</TabCount>
            </FilterTab>
          </FilterTabs>
        </FilterSection>

        {/* Content */}
        <ScrollableContent>
          {loading ? (
            <EmptyState>
              <LoadingSpinner />
              <EmptyTitle>참여 신청을 불러오는 중...</EmptyTitle>
            </EmptyState>
          ) : filteredApplications.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📋</EmptyIcon>
              <EmptyTitle>
                {filter === 'ALL' ? '참여 신청이 없습니다' : `${filter === 'PENDING' ? '대기 중인' : filter === 'ACCEPTED' ? '승인된' : '거절된'} 참여 신청이 없습니다`}
              </EmptyTitle>
              <EmptyDescription>
                {filter === 'ALL' ? '아직 아무도 이 스터디에 참여 신청을 하지 않았습니다.' : '해당 상태의 참여 신청이 없습니다.'}
              </EmptyDescription>
            </EmptyState>
          ) : (
            <ApplicationList>
              {filteredApplications.map((application) => {
                if (!application?.id) {
                  return null; // 유효하지 않은 application은 렌더링하지 않음
                }

                const isExpanded = expandedApplications.has(application.id);
                const hasContent = application.answers && typeof application.answers === 'object' && Object.keys(application.answers).length > 0;

                return (
                  <ApplicationCard key={application.id} $status={application.status || ApplicationStatus.PENDING}>
                    <ApplicationHeader>
                      <ApplicantInfo>
                        <UserAvatar>
                          <User size={18} />
                        </UserAvatar>
                        <ApplicantDetails>
                          <ApplicantName>{application.applicantId || '알 수 없는 사용자'}</ApplicantName>
                          <ApplicantDate>
                            {application.createdAt ?
                              formatDate(application.createdAt, false, 'yyyy년 MM월 dd일 HH:mm') :
                              '날짜 정보 없음'
                            }
                          </ApplicantDate>
                        </ApplicantDetails>
                      </ApplicantInfo>
                      <HeaderRight>
                        <StatusBadge $status={getStatusColor(application.status || ApplicationStatus.PENDING)}>
                          {getStatusIcon(application.status || ApplicationStatus.PENDING)}
                          <StatusText>
                            {(application.status === ApplicationStatus.PENDING || !application.status) && '대기 중'}
                            {application.status === ApplicationStatus.ACCEPTED && '승인됨'}
                            {application.status === ApplicationStatus.REJECTED && '거절됨'}
                          </StatusText>
                        </StatusBadge>
                        {hasContent && (
                          <ToggleButton
                            onClick={() => toggleApplicationExpanded(application.id)}
                            $expanded={isExpanded}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </ToggleButton>
                        )}
                      </HeaderRight>
                    </ApplicationHeader>

                    {hasContent && (
                      <CollapsibleContent $expanded={isExpanded}>
                        <ContentSection>
                          {Object.entries(application.answers || {}).map(([question, answer]) => (
                            <QuestionAnswer key={question}>
                              <QuestionLabel>
                                <FileText size={14} />
                                {question || '질문'}
                              </QuestionLabel>
                              <AnswerText>{answer || '답변 없음'}</AnswerText>
                            </QuestionAnswer>
                          ))}
                        </ContentSection>
                      </CollapsibleContent>
                    )}

                    {(application.status === ApplicationStatus.PENDING || !application.status) && (
                      <ActionSection>
                        <ActionButton
                          $variant="success"
                          onClick={() => handleAccept(application.id)}
                        >
                          <CheckCircle size={16} />
                          승인
                        </ActionButton>
                        <ActionButton
                          $variant="danger"
                          onClick={() => handleReject(application.id)}
                        >
                          <XCircle size={16} />
                          거절
                        </ActionButton>
                      </ActionSection>
                    )}
                  </ApplicationCard>
                );
              }).filter(Boolean)}
            </ApplicationList>
          )}
        </ScrollableContent>
      </Container>
    </Modal>
  );
};

const Container = styled.div`
  height: 800px;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}08 0%, ${({ theme }) => theme.colors.primary}03 100%);
  border: 1px solid ${({ theme }) => theme.colors.primary}15;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const StudyTitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  margin: 0;
`;

const StatsSummary = styled.div`
  display: flex;
  gap: 24px;
  
  @media (max-width: 768px) {
    justify-content: space-around;
    width: 100%;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const StatValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterSection = styled.div`
  margin-bottom: 24px;
  flex-shrink: 0;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 12px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FilterTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ $active, theme }) => 
    $active ? theme.colors.background : 'transparent'};
  border: ${({ $active, theme }) => 
    $active ? `1px solid ${theme.colors.border}` : '1px solid transparent'};
  border-radius: 8px;
  color: ${({ $active, theme }) => 
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
  box-shadow: ${({ $active, theme }) => 
    $active ? theme.shadows.small : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background};
  }
`;

const TabCount = styled.span`
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[300]};
    border-radius: 3px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.gray[400]};
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  height: 100%;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  max-width: 400px;
  margin: 0;
`;

const ApplicationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
`;

const ApplicationCard = styled.div<{ $status: ApplicationStatus }>`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  border: 1px solid ${({ theme, $status }) => {
    switch ($status) {
      case ApplicationStatus.PENDING: return theme.colors.warning + '30';
      case ApplicationStatus.ACCEPTED: return theme.colors.success + '30';
      case ApplicationStatus.REJECTED: return theme.colors.danger + '30';
      default: return theme.colors.border;
    }
  }};
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.2s;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${({ theme, $status }) => {
      switch ($status) {
        case ApplicationStatus.PENDING: return theme.colors.warning;
        case ApplicationStatus.ACCEPTED: return theme.colors.success;
        case ApplicationStatus.REJECTED: return theme.colors.danger;
        default: return theme.colors.gray[300];
      }
    }};
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.medium};
    transform: translateY(-1px);
  }
`;

const ApplicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 20px 16px 24px;
`;

const ApplicantInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primary}15;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`;

const ApplicantDetails = styled.div`
  flex: 1;
`;

const ApplicantName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const ApplicantDate = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ theme, $status }) => {
    switch ($status) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  }}15;
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  }};
  border: 1px solid ${({ theme, $status }) => {
    switch ($status) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  }}30;
`;

const StatusText = styled.span`
  font-size: 12px;
  font-weight: 600;
`;

const ToggleButton = styled.button<{ $expanded: boolean }>`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary}30;
  }

  svg {
    transition: transform 0.2s;
  }
`;

const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  max-height: ${({ $expanded }) => $expanded ? '1000px' : '0px'};
  opacity: ${({ $expanded }) => $expanded ? '1' : '0'};
`;

const ContentSection = styled.div`
  padding: 0 24px 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: 0;
`;

const QuestionAnswer = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const QuestionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
  margin-top: 16px;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AnswerText = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  white-space: pre-wrap;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 24px 20px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const ActionButton = styled.button<{ $variant: 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      default: return theme.colors.primary;
    }
  }};
  
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme, $variant }) => {
      switch ($variant) {
        case 'success': return theme.colors.success;
        case 'danger': return theme.colors.danger;
        default: return theme.colors.primary;
      }
    }}40;
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

export default StudyApplicationsModal;