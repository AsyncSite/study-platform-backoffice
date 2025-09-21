import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import Button, { ButtonVariant } from '../components/common/Button';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      await login({ username, password });
      // Navigation is handled in AuthContext after successful login
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoSection>
          <LogoIcon>S</LogoIcon>
          <LogoText>
            <span>Study</span>
            <span className="bold">Platform</span>
          </LogoText>
          <Subtitle>백오피스 관리자 시스템</Subtitle>
        </LogoSection>
        
        <LoginForm onSubmit={handleSubmit}>
          <FormTitle>관리자 로그인</FormTitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              disabled={loading}
              autoComplete="username"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
              autoComplete="current-password"
            />
          </FormGroup>
          
          <Button
            type="submit"
            variant={ButtonVariant.PRIMARY}
            fullWidth
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </LoginForm>
        
        <HelpText>
          로그인에 문제가 있으신가요?{' '}
          <HelpLink href="mailto:admin@asyncsite.com">관리자에게 문의</HelpLink>
        </HelpText>
      </LoginCard>
      
      <Background />
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray[50]};
  position: relative;
  overflow: hidden;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.05;
  z-index: 0;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xlarge};
  box-shadow: ${({ theme }) => theme.shadows.large};
  padding: 48px;
  position: relative;
  z-index: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 32px 24px;
    margin: 0 16px;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 24px;
  margin: 0 auto 16px;
`;

const LogoText = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
  
  span {
    font-weight: 300;
  }
  
  .bold {
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoginForm = styled.form`
  margin-bottom: 32px;
`;

const FormTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.medium};
  background-color: ${({ theme }) => theme.colors.surface};
  transition: ${({ theme }) => theme.transitions.normal};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.medium};
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #fecaca;
`;

const HelpText = styled.p`
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HelpLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default Login;