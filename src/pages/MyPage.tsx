import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {notiApi, type NotiSetting, type UpdateNotificationSettingsRequest} from '../api/noti';

const MyPage: React.FC = () => {
  const { user } = useAuth();
  const [notiSettings, setNotiSettings] = useState<NotiSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotificationSettings();
    }
  }, [user?.id]);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await notiApi.getNotiSetting(user!.id);
      if (response.success && response.data) {
        setNotiSettings(response.data);
      } else {
        // 기본값으로 초기화
        setNotiSettings({
          userId: user!.id,
          studyUpdates: false,
          marketing: false,
          emailEnabled: false,
          discordEnabled: false,
          pushEnabled: false,
          timezone: 'Asia/Seoul',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('알림 설정을 불러오는데 실패했습니다:', error);
      // 에러 시에도 기본값으로 초기화
      setNotiSettings({
        userId: user!.id,
        studyUpdates: false,
        marketing: false,
        emailEnabled: false,
        discordEnabled: false,
        pushEnabled: false,
        timezone: 'Asia/Seoul',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof UpdateNotificationSettingsRequest, value: boolean) => {
    if (notiSettings) {
      setNotiSettings(prev => prev ? { ...prev, [key]: value } : null);
    }
  };

  const handleSaveSettings = async () => {
    if (!notiSettings || !user?.id) return;

    try {
      setSaving(true);
      const updateData: UpdateNotificationSettingsRequest = {
        studyUpdates: notiSettings.studyUpdates,
        marketing: notiSettings.marketing,
        emailEnabled: notiSettings.emailEnabled,
        discordEnabled: notiSettings.discordEnabled,
        pushEnabled: notiSettings.pushEnabled,
      };

      const response = await notiApi.updateNotiSetting(user.id, updateData);
      if (response.success) {
        alert('알림 설정이 저장되었습니다.');
      } else {
        alert('알림 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      alert('알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingText>로딩 중...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader>
        <PageTitle>마이페이지</PageTitle>
        <PageSubtitle>계정 정보와 알림 설정을 관리하세요</PageSubtitle>
      </PageHeader>

      <ContentGrid>
        {/* 사용자 정보 섹션 */}
        <InfoCard>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow>
              <InfoLabel>이름</InfoLabel>
              <InfoValue>{user?.name || '이름 없음'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>사용자명</InfoLabel>
              <InfoValue>{user?.username || '사용자명 없음'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>이메일</InfoLabel>
              <InfoValue>{user?.email || '이메일 없음'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>역할</InfoLabel>
              <InfoValue>{user?.role === 'ADMIN' ? '관리자' : '운영자'}</InfoValue>
            </InfoRow>
          </CardContent>
        </InfoCard>

        {/* 알림 설정 섹션 */}
        <SettingsCard>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <SaveButton onClick={handleSaveSettings} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </SaveButton>
          </CardHeader>
          <CardContent>
            <SettingSection>
              <SectionTitle>알림 유형</SectionTitle>
              <SettingRow>
                <SettingLabel>스터디 업데이트 알림</SettingLabel>
                <ToggleSwitch
                  checked={notiSettings?.studyUpdates || false}
                  onChange={(e) => handleSettingChange('studyUpdates', e.target.checked)}
                />
              </SettingRow>
              <SettingRow>
                <SettingLabel>마케팅 알림</SettingLabel>
                <ToggleSwitch
                  checked={notiSettings?.marketing || false}
                  onChange={(e) => handleSettingChange('marketing', e.target.checked)}
                />
              </SettingRow>
            </SettingSection>

            <SettingSection>
              <SectionTitle>알림 채널</SectionTitle>
              <SettingRow>
                <SettingLabel>이메일 알림</SettingLabel>
                <ToggleSwitch
                  checked={notiSettings?.emailEnabled || false}
                  onChange={(e) => handleSettingChange('emailEnabled', e.target.checked)}
                />
              </SettingRow>
              <SettingRow>
                <SettingLabel>Discord 알림</SettingLabel>
                <ToggleSwitch
                  checked={notiSettings?.discordEnabled || false}
                  onChange={(e) => handleSettingChange('discordEnabled', e.target.checked)}
                />
              </SettingRow>
              <SettingRow>
                <SettingLabel>푸시 알림</SettingLabel>
                <ToggleSwitch
                  checked={notiSettings?.pushEnabled || false}
                  onChange={(e) => handleSettingChange('pushEnabled', e.target.checked)}
                />
              </SettingRow>
            </SettingSection>
          </CardContent>
        </SettingsCard>
      </ContentGrid>
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow: hidden;
`;

const SettingsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CardContent = styled.div`
  padding: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const SettingSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 44px;
  height: 24px;
  background: ${({ theme }) => theme.colors.gray[300]};
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};

  &:checked {
    background: ${({ theme }) => theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: ${({ theme }) => theme.transitions.normal};
  }

  &:checked::before {
    transform: translateX(20px);
  }
`;

const LoadingText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export default MyPage; 