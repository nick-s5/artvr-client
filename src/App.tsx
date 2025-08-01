import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './components/auth/LoginPage';
import GalleryPage from './components/gallery/GalleryPage';
import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const { isAuthenticated, restoreSession } = useAuthStore();

  useEffect(() => {
    // Try to restore session on app load
    restoreSession();
  }, [restoreSession]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/gallery" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/gallery" 
            element={
              isAuthenticated ? <GalleryPage /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/gallery" : "/login"} replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;