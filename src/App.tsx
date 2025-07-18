import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Dashboard from './pages/Dashboard';
import StudyManagement from './pages/StudyManagement';
import MemberManagement from './pages/MemberManagement';
import Login from './pages/Login';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AuthProvider>
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
              path="/members"
              element={
                <PrivateRoute>
                  <Layout>
                    <MemberManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            {/* Will add more routes */}
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;