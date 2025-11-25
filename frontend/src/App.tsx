import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Challenges from './pages/Challenges/Challenges';
import ChallengeDetail from './pages/Challenges/ChallengeDetail';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Teams from './pages/Teams/Teams';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Create custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4',
    },
    secondary: {
      main: '#ff5722',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Orbitron", "Roboto Mono", sans-serif',
    },
    h2: {
      fontFamily: '"Orbitron", "Roboto Mono", sans-serif',
    },
    h3: {
      fontFamily: '"Orbitron", "Roboto Mono", sans-serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/challenges" element={
                <ProtectedRoute>
                  <Layout>
                    <Challenges />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/challenges/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <ChallengeDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Leaderboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/teams" element={
                <ProtectedRoute>
                  <Layout>
                    <Teams />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Admin />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
