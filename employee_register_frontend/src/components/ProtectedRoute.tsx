// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requireUser = false 
}) => {
  const auth = useAuth();
  const location = useLocation();
  
  console.log("Protected route check:", {
    isLoggedIn: auth.isLoggedIn(),
    isAdmin: auth.isAdmin(),
    requireAdmin,
    requireUser,
    path: location.pathname
  });

  if (!auth.isLoggedIn()) {
    console.log("Not logged in, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !auth.isAdmin()) {
    console.log("Admin route but user is not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  if (requireUser && auth.isAdmin()) {
    console.log("User route but user is admin - allowing access anyway");
  }

  console.log("All checks passed, rendering route");
  return <>{children}</>;
};

export default ProtectedRoute;