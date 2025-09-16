import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Dashboard from './pages/Dashboard';
import StudyManagement from './pages/StudyManagement';
import MemberManagement from './pages/MemberManagement';
import MyPage from './pages/MyPage';
import Login from './pages/Login';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotiManagement from './pages/NotiManagement';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/studies"
              element={
                <PrivateRoute>
                  <Layout>
                    <StudyManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/noti-management"
              element={
                <PrivateRoute>
                  <Layout>
                    <NotiManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/members"
              element={
                <PrivateRoute>
                  <Layout>
                    <MemberManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/myPage"
              element={
                <PrivateRoute>
                  <Layout>
                    <MyPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            {/* Will add more routes */}
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;