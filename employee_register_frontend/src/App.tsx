// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TitleProvider } from './contexts/TitleContext';

import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import EmployeePage from './pages/EmployeePage';
import AttendancePage from './pages/AttendancePage';
import SalaryPage from './pages/SalaryPage';
import LoanRegisterPage from './pages/LoanRegisterPage';
import LoanRepayPage from './pages/LoanRepayPage';

import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  return (
    <TitleProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
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