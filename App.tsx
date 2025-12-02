import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { User } from './types';
import { api } from './services/api';
import { initPWA } from './src/utils/pwa';
import { LoadingProvider, useLoading } from './components/LoadingContext';

const AppContent: React.FC = () => {
  // Auth state now holds the User object or null
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showLoader, hideLoader, isLoading, loadingMessage } = useLoading();

  useEffect(() => {
    const checkAuth = async () => {
      showLoader("Initializing...");
      const token = localStorage.getItem('authToken');

      // Add timeout and error handling for the authentication check
      const authCheckTimeout = setTimeout(() => {
        console.warn('Authentication check timed out after 5 seconds');
        hideLoader();
      }, 5000);

      try {
        if (token) {
          // Use Promise.race to add timeout to the API call
          const authCheckPromise = api.auth.verify(token);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authentication timeout')), 5000)
          );

          const result = await Promise.race([authCheckPromise, timeoutPromise]) as { valid: boolean; userId?: number; username?: string };

          if (result && result.valid) {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
              setCurrentUser(JSON.parse(userStr));
            }
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
          }
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      } finally {
        clearTimeout(authCheckTimeout);
        hideLoader();
      }
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

      {/* Global Fullscreen Loader removed as requested */}
    </>
  );
};

import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  return (
    <LoadingProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </LoadingProvider>
  );
};

export default App;