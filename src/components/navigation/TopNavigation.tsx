import React from 'react';
import styled from 'styled-components';

const TopNavigation: React.FC = () => {
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
          
          <NewStudyButton>+ 새 스터디</NewStudyButton>
          
          <NotificationIcon>
            <span>🔔</span>
            <NotificationBadge />
          </NotificationIcon>
          
          <UserProfile>
            <UserAvatar>관리자</UserAvatar>
            <DropdownIcon>▼</DropdownIcon>
          </UserProfile>
        </TopNavContent>
      </Container>
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
  cursor: pointer;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
`;

const DropdownIcon = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export default TopNavigation;