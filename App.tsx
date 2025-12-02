import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { User } from './types';
import { api } from './services/api';
import { initPWA } from './src/utils/pwa';
import { LoadingProvider, useLoading } from './components/LoadingContext';
import FullScreenLoader from './components/FullScreenLoader';

const AppContent: React.FC = () => {
  // Auth state now holds the User object or null
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showLoader, hideLoader, isLoading, loadingMessage } = useLoading();

  useEffect(() => {
    const checkAuth = async () => {
      showLoader("Initializing...");
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const result = await api.auth.verify(token);
          if (result.valid) {
            // Fetch user details if needed, but for now assume token contains userId
            // Since verify returns userId and username, but we need full user object
            // For simplicity, store user in localStorage too, or fetch from API
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
              setCurrentUser(JSON.parse(userStr));
            }
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
          }
        } catch (err) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
        }
      }
      hideLoader();
    };

    // Initialize PWA features
    initPWA();

    checkAuth();
  }, [showLoader, hideLoader]);

  const handleLogin = (data: { user: User; token: string }) => {
    setCurrentUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard/*"
            element={
              currentUser ? (
                <Dashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Global Fullscreen Loader */}
      <FullScreenLoader isVisible={isLoading} message={loadingMessage} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;