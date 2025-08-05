import React from 'react';
import styled from 'styled-components';
import StudyCreateModalEnhanced from './StudyCreateModalEnhanced';
import type { StudyCreateRequest } from '../../types/api';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminStudyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyCreateRequest) => Promise<void>;
}

const AdminStudyCreateModal: React.FC<AdminStudyCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();

  return (
    <>
      <StudyCreateModalEnhanced
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
        currentUserId={user?.id}
        customHeader={
          <AdminNotice>
            <AlertCircle size={20} />
            <div>
              <NoticeTitle>관리자 직접 생성</NoticeTitle>
              <NoticeText>
                관리자가 직접 생성하는 스터디는 별도의 승인 과정 없이 즉시 활성화됩니다.
              </NoticeText>
            </div>
          </AdminNotice>
        }
      />
    </>
  );
};

const AdminNotice = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.info}10;
  border: 1px solid ${({ theme }) => theme.colors.info}20;
  border-radius: 8px;
  margin-bottom: 24px;

  svg {
    color: ${({ theme }) => theme.colors.info};
    flex-shrink: 0;
  }
`;

const NoticeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const NoticeText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

export default AdminStudyCreateModal;