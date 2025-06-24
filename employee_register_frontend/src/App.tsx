// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TitleProvider } from './contexts/TitleContext';

// Layout
import Layout from './components/Layout';

// Auth pages
import LoginPage from './pages/LoginPage';

// Content pages
import DashboardPage from './pages/DashboardPage';
import EmployeePage from './pages/EmployeePage';
import AttendancePage from './pages/AttendancePage';
import SalaryPage from './pages/SalaryPage';
import LoanRegisterPage from './pages/LoanRegisterPage';
import LoanRepayPage from './pages/LoanRepayPage';

// Utils
import ProtectedRoute from './components/ProtectedRoute';

// Main App Content Component (inside Router context)
const AppContent: React.FC = () => {
  return (
    <TitleProvider>
      <Routes>
        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Main routes with layout */}
        <Route element={<Layout />}>
          {/* Dashboard - accessible to both admin and user */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes */}
          <Route path="/employees" element={
            <ProtectedRoute requireAdmin>
              <EmployeePage />
            </ProtectedRoute>
          } />
          
          <Route path="/employees/add" element={
            <ProtectedRoute requireAdmin>
              <EmployeePage />
            </ProtectedRoute>
          } />
          
          <Route path="/employees/edit/:id" element={
            <ProtectedRoute requireAdmin>
              <EmployeePage />
            </ProtectedRoute>
          } />
          
          <Route path="/employees/view/:id" element={
            <ProtectedRoute requireAdmin>
              <EmployeePage />
            </ProtectedRoute>
          } />
          
          <Route path="/loan-register" element={
            <ProtectedRoute requireAdmin>
              <LoanRegisterPage />
            </ProtectedRoute>
          } />
          
          {/* Shared routes (accessible to both admin and user) */}
          <Route path="/attendance" element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          } />
          
          <Route path="/attendance/employee/:id" element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          } />
          
          <Route path="/salary" element={
            <ProtectedRoute>
              <SalaryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/salary/employee/:id" element={
            <ProtectedRoute>
              <SalaryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/loan-repay" element={
            <ProtectedRoute>
              <LoanRepayPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Catch-all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </TitleProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;