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

  // Not logged in - redirect to login
  if (!auth.isLoggedIn()) {
    console.log("Not logged in, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin route but user is not admin
  if (requireAdmin && !auth.isAdmin()) {
    console.log("Admin route but user is not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // User route but user is admin (optional check, might not be needed)
  if (requireUser && auth.isAdmin()) {
    console.log("User route but user is admin - allowing access anyway");
    // In employee management system, admins often need access to user routes too
    // If you want to restrict admins from certain user-only pages, uncomment below:
    // return <Navigate to="/dashboard" replace />;
  }

  // All checks passed, render the route
  console.log("All checks passed, rendering route");
  return <>{children}</>;
};

export default ProtectedRoute;