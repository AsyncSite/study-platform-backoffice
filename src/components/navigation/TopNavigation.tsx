import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import StudyCreateModal from '../study/StudyCreateModal';
import { studyApi } from '../../api/study';
import { useNotification } from '../../contexts/NotificationContext';
import type { StudyCreateRequest } from '../../types/api';

const TopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { showToast } = useNotification();
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  const handleMoveMyPage = () => {
      navigate('/myPage');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCreateStudy = async (data: StudyCreateRequest) => {
    try {
      await studyApi.createStudy(data);
      setIsCreateModalOpen(false);
      showToast('스터디가 성공적으로 생성되었습니다.', { type: 'success' });
      // 스터디 관리 페이지로 이동
      navigate('/studies');
    } catch (error) {
      console.error('Failed to create study:', error);
      showToast('스터디 생성에 실패했습니다.', { type: 'error' });
    }
  };
  
  return (
    <TopNav>
      <Container>
        <TopNavContent>
          <Logo>
            <LogoIcon>S</LogoIcon>
            <LogoText>
              <span>Study</span>
              <span className="bold">Platform</span>
            </LogoText>
          </Logo>

          <SearchBar type="text" placeholder="🔍 스터디, 회원, 결제 검색..." />
          
          <NewStudyButton onClick={() => setIsCreateModalOpen(true)}>+ 새 스터디</NewStudyButton>
          
          <NotificationIcon>
            <span>🔔</span>
            <NotificationBadge />
          </NotificationIcon>
          
          <UserProfile ref={dropdownRef}>
            <UserInfo onClick={toggleDropdown}>
              <UserAvatar>{user?.name?.[0] || user?.username?.[0] || '관'}</UserAvatar>
              <UserDetails>
                <UserName>{user?.name || user?.username || '관리자'}</UserName>
                <UserRole>{user?.role === 'ADMIN' ? '관리자' : '운영자'}</UserRole>
              </UserDetails>
            </UserInfo>
            <Dropdown onClick={toggleDropdown}>
              <DropdownIcon>▼</DropdownIcon>
              <DropdownMenu $isOpen={isDropdownOpen}>
                <DropdownItem onClick={handleMoveMyPage}>마이페이지</DropdownItem>
                <DropdownItem onClick={handleLogout}>로그아웃</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </UserProfile>
        </TopNavContent>
      </Container>

      {/* 스터디 생성 모달 */}
      <StudyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateStudy}
        currentUserId={user?.id || user?.username || 'admin'}
      />
    </TopNav>
  );
};

const TopNav = styled.nav`
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  height: 70px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
`;

const TopNavContent = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  gap: 20px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const LogoText = styled.div`
  font-size: 16px;
  
  span {
    font-weight: 300;
  }
  
  .bold {
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchBar = styled.input`
  width: 300px;
  height: 36px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 18px;
  border: none;
  padding: 0 15px;
  font-size: 13px;
  outline: none;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:focus {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const NewStudyButton = styled.button`
  padding: 8px 16px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 500;
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);
  }
`;

const NotificationIcon = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  background: ${({ theme }) => theme.colors.error};
  border-radius: 50%;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserRole = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Dropdown = styled.div`
  position: relative;
  cursor: pointer;
`;

const DropdownIcon = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
  position: absolute;
  top: 100%;
  right: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  padding: 8px 0;
  min-width: 150px;
  margin-top: 8px;
  z-index: 1000;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  background: none;
  border: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

export default TopNavigation;