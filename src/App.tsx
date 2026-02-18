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
import QueryDailyManagement from './pages/QueryDailyManagement';
import QueryDailyMobileManagement from './pages/QueryDailyMobileManagement';
import PaymentTransactionManagement from './pages/PaymentTransactionManagement';
import GritMomentManagement from './pages/GritMomentManagement';
import NewsletterManagement from './pages/NewsletterManagement';
import CouponManagement from './pages/CouponManagement';
import ProductManagement from './pages/ProductManagement';
import ReviewManagement from './pages/ReviewManagement';
import ResumeManagement from './pages/ResumeManagement';
import PsychtestCouponManagement from './pages/PsychtestCouponManagement';

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
              path="/query-daily"
              element={
                <PrivateRoute>
                  <Layout>
                    <QueryDailyManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/querydaily-mobile-management"
              element={
                <PrivateRoute>
                  <Layout>
                    <QueryDailyMobileManagement />
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
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Layout>
                    <PaymentTransactionManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/grit-moment"
              element={
                <PrivateRoute>
                  <Layout>
                    <GritMomentManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/newsletters"
              element={
                <PrivateRoute>
                  <Layout>
                    <NewsletterManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <PrivateRoute>
                  <Layout>
                    <CouponManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProductManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReviewManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <PrivateRoute>
                  <Layout>
                    <ResumeManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/psychtest-coupons"
              element={
                <PrivateRoute>
                  <Layout>
                    <PsychtestCouponManagement />
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