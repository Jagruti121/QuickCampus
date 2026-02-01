import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import Provider

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute'; 

function App() {
  return (
    <Router>
      {/* ⚠️ AuthProvider MUST wrap all Routes for useAuth() to work */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Protected Admin Route */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute requiredRole="Admin">
                <Dashboard />
              </PrivateRoute>
            } 
          />

          {/* Protected Faculty Route */}
          <Route 
            path="/faculty/dashboard" 
            element={
              <PrivateRoute requiredRole="Faculty">
                <Dashboard />
              </PrivateRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


export default App;