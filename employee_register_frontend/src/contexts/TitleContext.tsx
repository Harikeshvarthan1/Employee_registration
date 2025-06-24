// src/contexts/TitleContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type TitleContextType = {
  setPageTitle: (title: string) => void;
  pageTitle: string;
};

const TitleContext = createContext<TitleContextType>({
  setPageTitle: () => {},
  pageTitle: 'Employee Management System',
});

export const useTitle = () => useContext(TitleContext);

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState('Employee Management System');
  const location = useLocation();

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      '/': 'Login | EMS',
      '/login': 'Login | EMS',
      '/dashboard': 'Dashboard | EMS',
      '/employees': 'Employee Management | EMS',
      '/employees/add': 'Add Employee | EMS',
      '/attendance': 'Attendance Tracking | EMS',
      '/salary': 'Salary Management | EMS',
      '/loan-register': 'Loan Registration | EMS',
      '/loan-repay': 'Loan Repayments | EMS',
      '/profile': 'My Profile | EMS',
      '/admin/user-management': 'User Management | EMS',
      '/reports': 'Reports | EMS',
    };

    let newTitle = 'Employee Management System';
    
    if (location.pathname in routeTitles) {
      newTitle = routeTitles[location.pathname];
    } else if (location.pathname.startsWith('/employees/edit/')) {
      newTitle = 'Edit Employee | EMS';
    } else if (location.pathname.startsWith('/employees/view/')) {
      newTitle = 'Employee Details | EMS';
    } else if (location.pathname.startsWith('/attendance/employee/')) {
      newTitle = 'Employee Attendance | EMS';
    } else if (location.pathname.startsWith('/salary/employee/')) {
      newTitle = 'Employee Salary | EMS';
    } else if (location.pathname.startsWith('/loan-register/employee/')) {
      newTitle = 'Employee Loans | EMS';
    } else if (location.pathname.startsWith('/reports/')) {
      newTitle = 'Report Details | EMS';
    }
    
    setPageTitle(newTitle);
  }, [location.pathname]);

  const contextValue: TitleContextType = {
    setPageTitle,
    pageTitle,
  };

  return (
    <TitleContext.Provider value={contextValue}>
      {children}
    </TitleContext.Provider>
  );
};