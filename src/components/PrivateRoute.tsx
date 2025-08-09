import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, validateSession } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        const isValid = await validateSession();
        setSessionValid(isValid);
      }
      setIsValidating(false);
    };

    checkSession();
  }, [isAuthenticated, validateSession, location.pathname]);

  if (loading || isValidating) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>로딩중...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!isAuthenticated || !sessionValid) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.colors.gray[200]};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export default PrivateRoute;