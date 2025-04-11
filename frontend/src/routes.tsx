import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const MatchPage = React.lazy(() => import('./pages/MatchPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));

export default function AppRoutes() {
  return (
    <Router>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/subscribe" element={<SubscriptionPage />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}
