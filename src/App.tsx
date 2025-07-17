import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Dashboard from './pages/Dashboard';
import StudyManagement from './pages/StudyManagement';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studies" element={<StudyManagement />} />
            {/* Will add more routes */}
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;