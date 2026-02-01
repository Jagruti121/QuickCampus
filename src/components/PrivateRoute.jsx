import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user } = useAuth(); // Firebase User (Admin)
  
  // Get Stored Role
  const storedRole = localStorage.getItem('userRole');

  // 1. If not logged in at all -> Go to Login
  if (!user && !storedRole) {
    return <Navigate to="/" />;
  }

  // 2. If a specific role is required (e.g. 'Admin') but user is 'Faculty' -> Go to Login
  if (requiredRole && storedRole !== requiredRole) {
    // Optional: Redirect to their correct dashboard instead of login
    if (storedRole === 'Admin') return <Navigate to="/admin/dashboard" />;
    if (storedRole === 'Faculty') return <Navigate to="/faculty/dashboard" />;
    
    return <Navigate to="/" />;
  }

  // 3. Authorized -> Render Page
  return children;
};

export default PrivateRoute;