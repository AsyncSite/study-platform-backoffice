import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserDetail, UpdateUserRoleRequest, UpdateUserStatusRequest } from '../../types/user';
import { UserStatus } from '../../types/user';
import Badge from '../common/Badge';
import Button from '../common/Button';

interface MemberDetailPanelProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const MemberDetailPanel: React.FC<MemberDetailPanelProps> = ({
  user,
  onClose,
  onUpdate
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchUserDetail();
  }, [user.id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const detail = await usersApi.getUserDetail(user.id);
      setUserDetail(detail);
    } catch (error: any) {
      console.error('Failed to fetch user detail:', error);
      
      if (error.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('사용자 상세 정보를 조회할 권한이 없습니다.');
        onClose();
      } else if (error.response?.status === 404) {
        alert('사용자를 찾을 수 없습니다.');
        onClose();
      } else {
        alert(error.response?.data?.message || '사용자 상세 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!window.confirm(`역할을 ${newRole}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const request: UpdateUserRoleRequest = { role: newRole };
      await usersApi.updateUserRole(user.id, request);
      alert('역할이 변경되었습니다.');
      onUpdate();
      await fetchUserDetail();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      
      if (error.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('역할을 변경할 권한이 없습니다.');
      } else {
        alert(error.response?.data?.message || '역할 변경에 실패했습니다.');
      }
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!window.confirm(`상태를 ${newStatus}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const request: UpdateUserStatusRequest = { status: newStatus };
      await usersApi.updateUserStatus(user.id, request);
      alert('상태가 변경되었습니다.');
      onUpdate();
      await fetchUserDetail();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      
      if (error.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('상태를 변경할 권한이 없습니다.');
      } else {
        alert(error.response?.data?.message || '상태 변경에 실패했습니다.');
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!window.confirm('비밀번호를 초기화하시겠습니까? 사용자에게 초기화 이메일이 발송됩니다.')) {
      return;
    }

    try {
      const result = await usersApi.resetUserPassword(user.id);
      alert(result.message || '비밀번호 초기화 이메일이 발송되었습니다.');
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      
      if (error.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('비밀번호를 초기화할 권한이 없습니다.');
      } else {
        alert(error.response?.data?.message || '비밀번호 초기화에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <Panel>
      <PanelHeader>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <UserHeader>
          <UserAvatar>
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <AvatarPlaceholder>{user.name[0]}</AvatarPlaceholder>
            )}
          </UserAvatar>
          <UserHeaderInfo>
            <UserName>{user.name}</UserName>
            <UserEmail>{user.email}</UserEmail>
          </UserHeaderInfo>
        </UserHeader>
      </PanelHeader>

      <TabNav>
        <TabButton
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        >
          기본 정보
        </TabButton>
        <TabButton
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
        >
          활동 내역
        </TabButton>
        <TabButton
          active={activeTab === 'studies'}
          onClick={() => setActiveTab('studies')}
        >
          스터디
        </TabButton>
      </TabNav>

      <PanelContent>
        {loading ? (
          <LoadingContainer>
            <LoadingSpinner>⏳</LoadingSpinner>
            <LoadingText>정보를 불러오는 중...</LoadingText>
          </LoadingContainer>
        ) : (
          <>
            {activeTab === 'info' && userDetail && (
              <InfoSection>
                <InfoGroup>
                  <InfoLabel>역할</InfoLabel>
                  <InfoValue>
                    <Badge variant={
                      userDetail.role === 'ROLE_ADMIN' ? 'error' : 'default'
                    }>
                      {userDetail.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
                    </Badge>
                    {isAdmin && userDetail.role !== 'ROLE_ADMIN' && (
                      <RoleActions>
                        {userDetail.role === 'ROLE_USER' && (
                          <ActionButton onClick={() => handleRoleChange('ROLE_ADMIN')}>
                            관리자로 변경
                          </ActionButton>
                        )}
                        {userDetail.role === 'ROLE_ADMIN' && (
                          <ActionButton onClick={() => handleRoleChange('ROLE_USER')}>
                            일반회원으로 변경
                          </ActionButton>
                        )}
                      </RoleActions>
                    )}
                  </InfoValue>
                </InfoGroup>

                <InfoGroup>
                  <InfoLabel>상태</InfoLabel>
                  <InfoValue>
                    <Badge variant={
                      userDetail.status === UserStatus.ACTIVE ? 'success' :
                      userDetail.status === UserStatus.INACTIVE ? 'warning' : 'error'
                    }>
                      {userDetail.status === UserStatus.ACTIVE ? '활성' :
                       userDetail.status === UserStatus.INACTIVE ? '비활성' : '탈퇴'}
                    </Badge>
                    {isAdmin && userDetail.status !== UserStatus.WITHDRAWN && (
                      <StatusActions>
                        {userDetail.status === UserStatus.ACTIVE ? (
                          <ActionButton onClick={() => handleStatusChange(UserStatus.INACTIVE)}>
                            비활성화
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => handleStatusChange(UserStatus.ACTIVE)}>
                            활성화
                          </ActionButton>
                        )}
                      </StatusActions>
                    )}
                  </InfoValue>
                </InfoGroup>

                <InfoGroup>
                  <InfoLabel>가입일</InfoLabel>
                  <InfoValue>{formatDate(userDetail.createdAt)}</InfoValue>
                </InfoGroup>

                <InfoGroup>
                  <InfoLabel>마지막 로그인</InfoLabel>
                  <InfoValue>
                    {userDetail.lastLoginAt ? formatDate(userDetail.lastLoginAt) : '없음'}
                  </InfoValue>
                </InfoGroup>

                <InfoGroup>
                  <InfoLabel>가입 경로</InfoLabel>
                  <InfoValue>
                    {userDetail.provider === 'GOOGLE' ? '구글' :
                     userDetail.provider === 'KAKAO' ? '카카오' :
                     userDetail.provider === 'NAVER' ? '네이버' : '일반가입'}
                  </InfoValue>
                </InfoGroup>

                <InfoGroup>
                  <InfoLabel>연락처</InfoLabel>
                  <InfoValue>{userDetail.phoneNumber || '미등록'}</InfoValue>
                </InfoGroup>

                {isAdmin && (
                  <ActionSection>
                    <Button variant="secondary" onClick={handlePasswordReset}>
                      비밀번호 초기화
                    </Button>
                  </ActionSection>
                )}
              </InfoSection>
            )}

            {activeTab === 'activity' && userDetail && (
              <ActivitySection>
                <SectionTitle>최근 활동 내역</SectionTitle>
                {userDetail.activityLogs && userDetail.activityLogs.length > 0 ? (
                  <ActivityList>
                    {userDetail.activityLogs.map((log) => (
                      <ActivityItem key={log.id}>
                        <ActivityIcon>
                          {log.action === 'LOGIN' ? '🔐' :
                           log.action === 'STUDY_JOIN' ? '📚' : '📝'}
                        </ActivityIcon>
                        <ActivityContent>
                          <ActivityAction>{log.action}</ActivityAction>
                          {log.details && <ActivityDetails>{log.details}</ActivityDetails>}
                          <ActivityTime>{formatDate(log.createdAt)}</ActivityTime>
                        </ActivityContent>
                      </ActivityItem>
                    ))}
                  </ActivityList>
                ) : (
                  <EmptyMessage>활동 내역이 없습니다.</EmptyMessage>
                )}
              </ActivitySection>
            )}

            {activeTab === 'studies' && userDetail && (
              <StudiesSection>
                <SectionTitle>참여 중인 스터디</SectionTitle>
                {userDetail.participatingStudies && userDetail.participatingStudies.length > 0 ? (
                  <StudyList>
                    {userDetail.participatingStudies.map((study) => (
                      <StudyItem key={study.id}>
                        <StudyTitle>{study.title}</StudyTitle>
                        <StudyInfo>
                          <Badge variant={study.role === 'PROPOSER' ? 'primary' : 'default'}>
                            {study.role === 'PROPOSER' ? '제안자' : '참여자'}
                          </Badge>
                          <StudyDate>참여일: {formatDate(study.joinedAt)}</StudyDate>
                        </StudyInfo>
                      </StudyItem>
                    ))}
                  </StudyList>
                ) : (
                  <EmptyMessage>참여 중인 스터디가 없습니다.</EmptyMessage>
                )}

                <SectionTitle>제안한 스터디</SectionTitle>
                {userDetail.proposedStudies && userDetail.proposedStudies.length > 0 ? (
                  <StudyList>
                    {userDetail.proposedStudies.map((study) => (
                      <StudyItem key={study.id}>
                        <StudyTitle>{study.title}</StudyTitle>
                        <StudyInfo>
                          <Badge variant="primary">제안자</Badge>
                          <StudyDate>생성일: {formatDate(study.joinedAt)}</StudyDate>
                        </StudyInfo>
                      </StudyItem>
                    ))}
                  </StudyList>
                ) : (
                  <EmptyMessage>제안한 스터디가 없습니다.</EmptyMessage>
                )}
              </StudiesSection>
            )}
          </>
        )}
      </PanelContent>
    </Panel>
  );
};

const Panel = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 480px;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CloseButton = styled.button`
  position: absolute;
  right: 24px;
  top: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 50%;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.gray[600]};
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  font-size: 24px;
`;

const UserHeaderInfo = styled.div``;

const UserName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.gray[600]};
  border-bottom: 2px solid ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const InfoSection = styled.div``;

const InfoGroup = styled.div`
  margin-bottom: 20px;
`;

const InfoLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 6px;
`;

const InfoValue = styled.div`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.gray[800]};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RoleActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StatusActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ActionSection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ActivitySection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: 16px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItem = styled.div`
  display: flex;
  gap: 12px;
`;

const ActivityIcon = styled.div`
  font-size: 20px;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityAction = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const ActivityDetails = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: 2px;
`;

const ActivityTime = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 4px;
`;

const StudiesSection = styled.div``;

const StudyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
`;

const StudyItem = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 8px;
`;

const StudyTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: 8px;
`;

const StudyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StudyDate = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 14px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
`;

const LoadingSpinner = styled.div`
  font-size: 32px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

export default MemberDetailPanel;