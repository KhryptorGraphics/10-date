import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const MatchPage = React.lazy(() => import('./pages/MatchPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
const PrivacyCenterPage = React.lazy(() => import('./pages/PrivacyCenterPage'));
const MatchAnalyticsPage = React.lazy(() => import('./pages/admin/MatchAnalyticsPage'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

export default function AppRoutes() {
  return (
    <Router>
      <Layout>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/match" element={
              <ProtectedRoute>
                <MatchPage />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/subscribe" element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            <Route path="/privacy" element={
              <ProtectedRoute>
                <PrivacyCenterPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute>
                <MatchAnalyticsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </React.Suspense>
      </Layout>
    </Router>
  );
}
