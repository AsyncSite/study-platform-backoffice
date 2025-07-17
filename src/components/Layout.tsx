import React from 'react';
import styled from 'styled-components';
import TopNavigation from './navigation/TopNavigation';
import TabNavigation from './navigation/TabNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <TopNavigation />
      <MainContainer>
        <ContentWrapper>
          <TabNavigation />
          <ContentArea>{children}</ContentArea>
        </ContentWrapper>
      </MainContainer>
    </>
  );
};

const MainContainer = styled.div`
  width: 100%;
  padding: 0;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
`;

const ContentArea = styled.main`
  min-height: calc(100vh - 70px);
  background-color: ${({ theme }) => theme.colors.background};
`;

export default Layout;