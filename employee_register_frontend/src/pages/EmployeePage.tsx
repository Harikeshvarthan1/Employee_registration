// src/pages/EmployeePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeForm from '../components/employees/EmployeeForm';
import { getAllEmployees, getAllActiveEmployees } from '../apis/employeeApi';
import type { Employee } from '../models/types';
import './EmployeePage.css';

const EmployeePage: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dashboardVisible, setDashboardVisible] = useState<boolean>(true);
  
  // Triple tap functionality states
  const [, setTapCount] = useState<number>(0);
  const [showSecretMessage, setShowSecretMessage] = useState<boolean>(false);
  
  // References for scroll animations
  const dashboardRef = useRef<HTMLDivElement>(null);
  const employeeListRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  
  // Handle loader tap for triple tap detection
  const handleLoaderTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      
      // If it's the third tap, show the secret message
      if (newCount === 3) {
        setShowSecretMessage(true);
        
        // Hide the message after 5 seconds
        setTimeout(() => {
          setShowSecretMessage(false);
        }, 5000);
        
        // Reset the counter after showing the message
        setTimeout(() => {
          setTapCount(0);
        }, 1000);
        
        return 0;
      }
      
      // Reset tap count if not tapped again within 2 seconds
      setTimeout(() => {
        setTapCount(0);
      }, 2000);
      
      return newCount;
    });
  };
  
  // Redirect non-admin users
  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate('/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);
  
  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [allEmployees, activeEmps] = await Promise.all([
          getAllEmployees(),
          getAllActiveEmployees()
        ]);
        
        setEmployees(allEmployees);
        setActiveEmployees(activeEmps);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading employees:', err);
        setError(err.message || 'Failed to load employee data');
        // Keep loading state active when there's an error
        // This will show the loading spinner instead of the error message
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate dashboard statistics
  const calculateStatistics = () => {
    const totalEmployees = employees.length;
    const activeCount = activeEmployees.length;
    const inactiveCount = totalEmployees - activeCount;
    const activePercentage = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0;
    
    // Role distribution for chart
    const roleDistribution: Record<string, number> = {};
    employees.forEach(emp => {
      roleDistribution[emp.role] = (roleDistribution[emp.role] || 0) + 1;
    });
    
    // Sort roles by count for visualization
    const roles = Object.keys(roleDistribution).sort(
      (a, b) => roleDistribution[b] - roleDistribution[a]
    );
    
    // Calculate average salary
    const totalSalary = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
    const averageSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;
    
    // Find newest employee
    const sortedByDate = [...employees].sort(
      (a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );
    const newestEmployee = sortedByDate.length > 0 ? sortedByDate[0] : null;
    
    // Find highest-paid employee
    const sortedBySalary = [...employees].sort(
      (a, b) => b.baseSalary - a.baseSalary
    );
    const highestPaidEmployee = sortedBySalary.length > 0 ? sortedBySalary[0] : null;
    
    return {
      totalEmployees,
      activeCount,
      inactiveCount,
      activePercentage,
      roleDistribution,
      roles,
      averageSalary,
      newestEmployee,
      highestPaidEmployee,
      totalSalary
    };
  };
  
  const stats = calculateStatistics();
  
  // Handle adding a new employee
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setViewMode('form');
    setDashboardVisible(false);
    
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle editing an existing employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode('form');
    setDashboardVisible(false);
    
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle form submission success
  const handleFormSuccess = (employee: Employee) => {
    // Update local state with the new/updated employee
    if (selectedEmployee) {
      // Edit mode - update existing employee
      setEmployees(prev => 
        prev.map(emp => emp.id === employee.id ? employee : emp)
      );
      
      if (employee.status === 'active') {
        setActiveEmployees(prev => {
          // Check if employee is already in active list
          const exists = prev.some(emp => emp.id === employee.id);
          if (exists) {
            // Update existing active employee
            return prev.map(emp => emp.id === employee.id ? employee : emp);
          } else {
            // Add to active list
            return [...prev, employee];
          }
        });
      } else {
        // Remove from active list if status changed to inactive
        setActiveEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      }
    } else {
      // Add mode - add new employee
      setEmployees(prev => [...prev, employee]);
      
      if (employee.status === 'active') {
        setActiveEmployees(prev => [...prev, employee]);
      }
    }
    
    // Return to list view
    setViewMode('list');
    setSelectedEmployee(null);
    setDashboardVisible(true);
    
    // Smooth scroll to list
    if (employeeListRef.current) {
      employeeListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  
  // Cancel form and return to list view
  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedEmployee(null);
    setDashboardVisible(true);
    
    // Smooth scroll to list
    if (employeeListRef.current) {
      employeeListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Generate color for role distribution chart
  const getRoleColor = (index: number): string => {
    const colors = [
      '#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', 
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
      '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6'
    ];
    
    return colors[index % colors.length];
  };
  
  // Determine if we should show loading state (either loading or error occurred)
  const showLoading = isLoading || error !== null;
  
  return (
    <div className="employee-page">
      
      <main className="employee-page-content">
        {/* Page Title Section */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Employee Management</h1>
            <p className="page-description">
              Manage your workforce, view employee statistics, and track employee information
            </p>
          </div>
          
          {viewMode === 'list' && !showLoading && (
            <button className="add-employee-button" onClick={handleAddEmployee}>
              <span className="button-icon">
                <i className="bi bi-person-plus-fill"></i>
              </span>
              <span className="button-text">Add Employee</span>
            </button>
          )}
        </div>
        
        {/* Loading State - Modified to include triple tap functionality */}
        {showLoading && (
          <div className="loading-container">
            <div className="loading-content" onClick={handleLoaderTap}>
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h3>Loading Employee Data</h3>
              <p>Please wait while we retrieve the information...</p>
              
              {/* Secret message that appears after triple tap */}
              {showSecretMessage && (
                <div className="secret-message">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <p>Backend connection issue detected. Please contact system administrator.</p>
                  <small>Error code: CONN_REFUSED_550</small>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Dashboard Section - Visible in list mode when not loading */}
        {dashboardVisible && viewMode === 'list' && !showLoading && (
          <div className="dashboard-section" ref={dashboardRef}>
            {/* Main Stats Cards */}
            <div className="stats-overview">
              <div className="stat-card total-employees">
                <div className="stat-header">
                  <h3>Total Employees</h3>
                  <div className="stat-icon">
                    <i className="bi bi-people-fill"></i>
                  </div>
                </div>
                <div className="stat-value">{stats.totalEmployees}</div>
                <div className="stat-comparison">
                  <div className="stat-metric">
                    <span className="label">Active:</span>
                    <span className="value positive">{stats.activeCount}</span>
                  </div>
                  <div className="stat-metric">
                    <span className="label">Inactive:</span>
                    <span className="value negative">{stats.inactiveCount}</span>
                  </div>
                </div>
                
                {/* Progress bar showing active percentage */}
                <div className="stat-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${stats.activePercentage}%` }}
                  ></div>
                  <span className="progress-label">{stats.activePercentage}% Active</span>
                </div>
              </div>
              
              <div className="stat-card salary-stats">
                <div className="stat-header">
                  <h3>Salary Insights</h3>
                  <div className="stat-icon">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
                <div className="stat-value">{formatCurrency(stats.averageSalary)}</div>
                <div className="stat-label">Average Monthly Salary</div>
                <div className="stat-comparison">
                  <div className="stat-metric">
                    <span className="label">Total Monthly:</span>
                    <span className="value">{formatCurrency(stats.totalSalary)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card recent-activity">
                <div className="stat-header">
                  <h3>Employee Highlights</h3>
                  <div className="stat-icon">
                    <i className="bi bi-lightning-charge-fill"></i>
                  </div>
                </div>
                
                <div className="highlight-container">
                  {stats.newestEmployee && (
                    <div className="employee-highlight newest">
                      <div className="highlight-avatar">
                        {stats.newestEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="highlight-details">
                        <div className="highlight-title">Newest Team Member</div>
                        <div className="highlight-name">{stats.newestEmployee.name}</div>
                        <div className="highlight-meta">
                          <span className="highlight-role">{stats.newestEmployee.role}</span>
                          <span className="highlight-date">
                            Joined {formatDate(stats.newestEmployee.joinDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {stats.highestPaidEmployee && (
                    <div className="employee-highlight highest-paid">
                      <div className="highlight-avatar gold">
                        {stats.highestPaidEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="highlight-details">
                        <div className="highlight-title">Highest Salary</div>
                        <div className="highlight-name">{stats.highestPaidEmployee.name}</div>
                        <div className="highlight-meta">
                          <span className="highlight-role">{stats.highestPaidEmployee.role}</span>
                          <span className="highlight-salary">
                            {formatCurrency(stats.highestPaidEmployee.baseSalary)}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Role Distribution Section */}
            <div className="role-distribution-section">
              <div className="section-header">
                <h2>Role Distribution</h2>
                <p>Breakdown of employees by job role</p>
              </div>
              
              <div className="role-distribution-content">
                <div className="role-chart">
                  {stats.roles.slice(0, 8).map((role, index) => (
                    <div key={role} className="role-bar-container">
                      <div className="role-label">{role}</div>
                      <div className="role-bar-wrapper">
                        <div 
                          className="role-bar"
                          style={{ 
                            width: `${(stats.roleDistribution[role] / stats.totalEmployees) * 100}%`,
                            backgroundColor: getRoleColor(index)
                          }}
                        >
                          <span className="role-count">{stats.roleDistribution[role]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="role-legend">
                  {stats.roles.slice(0, 8).map((role, index) => (
                    <div key={role} className="legend-item">
                      <div 
                        className="color-indicator"
                        style={{ backgroundColor: getRoleColor(index) }}
                      ></div>
                      <div className="legend-label">{role}</div>
                      <div className="legend-value">
                        {Math.round((stats.roleDistribution[role] / stats.totalEmployees) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Employee Form or List based on viewMode - Only shown when not loading */}
        {!showLoading && viewMode === 'form' ? (
          <div className="employee-form-wrapper">
            <EmployeeForm 
              employee={selectedEmployee || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCancelForm}
            />
          </div>
        ) : !showLoading && viewMode === 'list' && (
          <div className="employee-list-wrapper" ref={employeeListRef}>
            <EmployeeList
              onEditEmployee={handleEditEmployee}
              onAddEmployee={handleAddEmployee}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeePage;