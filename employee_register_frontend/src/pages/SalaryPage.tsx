import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllSalaries, addSalary, deleteSalary, updateSalary } from '.././apis/salaryApi';
import { getAllActiveEmployees } from '.././apis/employeeApi';
import type { Employee, Salary } from '.././models/types';
import { formatCurrency, formatDate, getMonthName } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './SalaryPage.css';

const SalaryPage: React.FC = () => {
  // Main data states
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredSalaries, setFilteredSalaries] = useState<Salary[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'add'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [salaryToDelete, setSalaryToDelete] = useState<Salary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // New states for view/edit functionality
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    employeeId: number;
    datePaid: string;
    paymentType: 'salary' | 'daily_credit';
    amount: number;
    lastSalaryDate: string;
  }>({
    employeeId: 0,
    datePaid: '',
    paymentType: 'salary',
    amount: 0,
    lastSalaryDate: ''
  });

  // Triple tap functionality states
  const [, setTapCount] = useState<number>(0);
  const [showSecretMessage, setShowSecretMessage] = useState<boolean>(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<number | ''>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Form states with proper types
  const [formData, setFormData] = useState<{
    employeeId: number | string;
    datePaid: string;
    paymentType: 'salary' | 'daily_credit';
    amount: number;
    lastSalaryDate: string;
  }>({
    employeeId: '',
    datePaid: new Date().toISOString().split('T')[0],
    paymentType: 'salary',
    amount: 0,
    lastSalaryDate: ''
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Determine if we should show loading state (either loading or error occurred)
  const showLoading = isLoading || error !== null;

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

  // Load salaries and employees on component mount
  useEffect(() => {
    loadInitialData();

    // Check if dark mode preference exists
    const darkModePref = localStorage.getItem('ems-dark-mode');
    if (darkModePref === 'true') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Apply theme when dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('ems-dark-mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('ems-dark-mode', 'false');
    }
  }, [isDarkMode]);

  // Load salaries and employees data
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [salaryData, employeeData] = await Promise.all([
        getAllSalaries(),
        getAllActiveEmployees()
      ]);
      
      setSalaries(salaryData);
      setFilteredSalaries(salaryData);
      setEmployees(employeeData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      // Don't set isLoading to false when there's an error
      // This will keep the loading state active
    }
  };

  // Apply filters to the salary data
  const applyFilters = useCallback(() => {
    let result = [...salaries];

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(salary => {
        const employee = employees.find(emp => emp.id === salary.employeeId);
        return employee?.name.toLowerCase().includes(term);
      });
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(salary => {
        const paidDate = new Date(salary.datePaid);
        return paidDate.toDateString() === filterDate.toDateString();
      });
    }

    // Employee filter
    if (employeeFilter !== '') {
      result = result.filter(salary => salary.employeeId === employeeFilter);
    }

    // Payment type filter
    if (typeFilter) {
      result = result.filter(salary => salary.paymentType === typeFilter);
    }

    // Sort by date (newest first)
    result.sort((a, b) => {
      return new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime();
    });

    setFilteredSalaries(result);
  }, [salaries, searchTerm, dateFilter, employeeFilter, typeFilter, employees]);

  // Update filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters, searchTerm, dateFilter, employeeFilter, typeFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setEmployeeFilter('');
    setTypeFilter('');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle view salary details
  const handleViewSalary = (salary: Salary) => {
    setSelectedSalary(salary);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  // Handle edit salary
  const handleEditSalary = (salary: Salary) => {
    setSelectedSalary(salary);
    setEditFormData({
      employeeId: salary.employeeId,
      datePaid: typeof salary.datePaid === 'string' ? salary.datePaid.split('T')[0] : new Date(salary.datePaid).toISOString().split('T')[0],
      paymentType: salary.paymentType,
      amount: salary.amount,
      lastSalaryDate: salary.lastSalaryDate ? 
        (typeof salary.lastSalaryDate === 'string' ? salary.lastSalaryDate.split('T')[0] : new Date(salary.lastSalaryDate).toISOString().split('T')[0]) : ''
    });
    setIsEditMode(true);
    setShowViewModal(true);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }

    setEditFormData({
      ...editFormData,
      [name]: processedValue
    } as any);
  };

  // Handle update salary
  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSalary?.id || !editFormData.employeeId || !editFormData.datePaid || editFormData.amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedSalary = await updateSalary(selectedSalary.id, {
        employeeId: editFormData.employeeId,
        datePaid: editFormData.datePaid,
        paymentType: editFormData.paymentType,
        amount: editFormData.amount,
        lastSalaryDate: editFormData.lastSalaryDate || undefined
      });

      // Update local state
      setSalaries(salaries.map(s => s.id === selectedSalary.id ? updatedSalary : s));
      
      // Show success message
      setSuccessMessage('Salary payment updated successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      // Close modal
      setShowViewModal(false);
      setSelectedSalary(null);
      setIsEditMode(false);
      
    } catch (err: any) {
      console.error('Error updating salary:', err);
      setError(err.message || 'Failed to update salary payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedSalary(null);
    setIsEditMode(false);
    setError(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }

    setFormData({
      ...formData,
      [name]: processedValue
    } as any);
  };

  // Handle form submission for adding new salary
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.datePaid || formData.amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Set last salary date to previous month if not specified
      let lastSalaryDate = formData.lastSalaryDate;
      if (!lastSalaryDate) {
        const previousMonth = new Date(formData.datePaid);
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        lastSalaryDate = previousMonth.toISOString().split('T')[0];
      }
      
      // Create the salary object with the correct types
      const salaryToAdd: Omit<Salary, 'id'> = {
        employeeId: Number(formData.employeeId),
        datePaid: formData.datePaid,
        paymentType: formData.paymentType,
        amount: formData.amount,
        lastSalaryDate: lastSalaryDate
      };
      
      const newSalary = await addSalary(salaryToAdd);
      
      // Update local state
      setSalaries([newSalary, ...salaries]);
      
      // Show success message
      setSuccessMessage('Salary payment added successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      // Reset form
      setFormData({
        employeeId: '',
        datePaid: new Date().toISOString().split('T')[0],
        paymentType: 'salary',
        amount: 0,
        lastSalaryDate: ''
      });
      
      // Switch to history tab
      setActiveTab('history');
      
    } catch (err: any) {
      console.error('Error adding salary:', err);
      setError(err.message || 'Failed to add salary payment');
      // We don't set isSubmitting to false when there's an error
      // to maintain the loading state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const confirmDelete = (salary: Salary) => {
    setSalaryToDelete(salary);
    setShowDeleteConfirm(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setSalaryToDelete(null);
    setShowDeleteConfirm(false);
  };

  // Handle salary deletion
  const handleDelete = async () => {
    if (!salaryToDelete || !salaryToDelete.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteSalary(salaryToDelete.id);
      
      // Update local state
      setSalaries(salaries.filter(s => s.id !== salaryToDelete.id));
      
      // Show success message
      setSuccessMessage('Salary payment deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      setShowDeleteConfirm(false);
      setSalaryToDelete(null);
      setIsLoading(false);

      // Close view modal if it's open
      if (showViewModal && selectedSalary?.id === salaryToDelete.id) {
        setShowViewModal(false);
        setSelectedSalary(null);
        setIsEditMode(false);
      }
    } catch (err: any) {
      console.error('Error deleting salary:', err);
      setError(err.message || 'Failed to delete salary payment');
      // We don't set isLoading to false when there's an error
      // to maintain the loading state
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: number): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  // Get employee details by ID
  const getEmployeeDetails = (employeeId: number): Employee | null => {
    return employees.find(emp => emp.id === employeeId) || null;
  };

  // Get total salary paid
  const getTotalSalaryPaid = (): number => {
    return salaries.reduce((total, salary) => total + salary.amount, 0);
  };

  // Get monthly salary data for chart
  const getMonthlyData = () => {
    const monthlyData: Record<string, number> = {};

    // Initialize with zero values for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData[monthKey] = 0;
    }

    // Aggregate salary amounts by month
    salaries.forEach(salary => {
      const date = new Date(salary.datePaid);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      // Only consider last 6 months
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += salary.amount;
      }
    });

    // Convert to array for chart
    return Object.entries(monthlyData).map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: `${getMonthName(month)} ${year}`,
        amount: value,
      };
    });
  };

  // Upload CSV file for bulk salary payment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would process the CSV here
      // For demo, we'll just show a success message
      setSuccessMessage('CSV file uploaded successfully! Processing 15 salary payments...');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Print salary report
  const printReport = () => {
    window.print();
  };

  // Export to CSV
  const exportToCsv = () => {
    // In a real app, you would generate a CSV file here
    // For demo, we'll just show a success message
    setSuccessMessage('Salary report exported to CSV successfully!');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className={`salary-page-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Page Header */}
      <div className="salary-page-header">
        <div className="header-content">
          <div className="header-title">
            <h1><i className="bi bi-cash-stack"></i> Salary Management</h1>
            <p>Manage employee salary payments and view payment history</p>
          </div>

          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`bi ${isDarkMode ? 'bi-sun' : 'bi-moon'}`}></i>
            </button>
            
            {!showLoading && (
              <div className="header-buttons">
                <button className="btn btn-outline" onClick={printReport}>
                  <i className="bi bi-printer"></i> Print
                </button>
                <button className="btn btn-outline" onClick={exportToCsv}>
                  <i className="bi bi-download"></i> Export
                </button>
                <label className="btn btn-outline upload-btn">
                  <i className="bi bi-upload"></i> Upload CSV
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('add')}
                >
                  <i className="bi bi-plus-circle"></i> New Payment
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary Cards - Only show when not loading */}
        {!showLoading && (
          <div className="summary-cards">
            <div className="summary-card total-payments">
              <div className="card-icon">
                <i className="bi bi-credit-card"></i>
              </div>
              <div className="card-content">
                <h3>{salaries.length}</h3>
                <p>Total Payments</p>
              </div>
            </div>
            
            <div className="summary-card total-amount">
              <div className="card-icon">
                <i className="bi bi-cash"></i>
              </div>
              <div className="card-content">
                <h3>{formatCurrency(getTotalSalaryPaid())}</h3>
                <p>Total Amount Paid</p>
              </div>
            </div>
            
            <div className="summary-card this-month">
              <div className="card-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="card-content">
                <h3>{formatCurrency(
                  salaries.filter(s => {
                    const date = new Date(s.datePaid);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && 
                           date.getFullYear() === now.getFullYear();
                  }).reduce((sum, s) => sum + s.amount, 0)
                )}</h3>
                <p>This Month</p>
              </div>
            </div>
            
            <div className="summary-card employees-paid">
              <div className="card-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="card-content">
                <h3>{Array.from(new Set(salaries.map(s => s.employeeId))).length}</h3>
                <p>Employees Paid</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tab Navigation - Only show when not loading */}
      {!showLoading && (
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-graph-up"></i> Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history"></i> Payment History
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <i className="bi bi-plus-circle"></i> Add Payment
          </button>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="tab-content">
        {/* Loading Container - Modified to include triple tap functionality */}
        {showLoading && (
          <div className="loading-container">
            <div className="loading-content" onClick={handleLoaderTap}>
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h3>Loading Salary Data</h3>
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
        
        {/* Overview Tab - Only show when not loading */}
        {!showLoading && activeTab === 'overview' && (
          <div className="overview-container" id="overview-tab">
            <div className="chart-section">
              <div className="chart-header">
                <h2>Monthly Salary Distribution</h2>
                <div className="chart-controls">
                  <button className="btn btn-sm btn-outline">
                    <i className="bi bi-funnel"></i> Filter
                  </button>
                  <select className="chart-select">
                    <option value="6">Last 6 Months</option>
                    <option value="12">Last 12 Months</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
              
              {/* Salary Chart */}
              <div className="chart-container" ref={chartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? '#ccc' : '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? '#ccc' : '#666' }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'Amount Paid']}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                        border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                        color: isDarkMode ? '#eee' : '#333',
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#4361ee" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    >
                      {getMonthlyData().map((_entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === getMonthlyData().length - 1 ? '#4cc9f0' : '#4361ee'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="overview-grid">
              {/* Recent Payments */}
              <div className="recent-payments card">
                <div className="card-header">
                  <h2>Recent Payments</h2>
                  <button 
                    className="btn btn-link" 
                    onClick={() => setActiveTab('history')}
                  >
                    View All <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
                <div className="card-body">
                  {filteredSalaries.slice(0, 5).length > 0 ? (
                    <div className="recent-payment-list">
                      {filteredSalaries.slice(0, 5).map((salary) => (
                        <div className="payment-item" key={salary.id}>
                          <div className="payment-icon">
                            <i className={`bi ${salary.paymentType === 'salary' ? 'bi-wallet2' : 'bi-cash-coin'}`}></i>
                          </div>
                          <div className="payment-details">
                            <div className="payment-primary">
                              <span className="employee-name">{getEmployeeName(salary.employeeId)}</span>
                              <span className="payment-amount">{formatCurrency(salary.amount)}</span>
                            </div>
                            <div className="payment-secondary">
                              <span className="payment-date">{formatDate(salary.datePaid)}</span>
                              <span className="payment-type">
                                {salary.paymentType === 'salary' ? 'Monthly Salary' : 'Daily Credit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="bi bi-clock"></i>
                      </div>
                      <p>No recent payments found</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Top Paid Employees */}
              <div className="top-employees card">
                <div className="card-header">
                  <h2>Top Paid Employees</h2>
                </div>
                <div className="card-body">
                  {employees.length > 0 ? (
                    <div className="top-employees-list">
                      {employees
                        .sort((a, b) => b.baseSalary - a.baseSalary)
                        .slice(0, 5)
                        .map((employee, index) => (
                          <div className="employee-item" key={employee.id}>
                            <div className="employee-rank">{index + 1}</div>
                            <div className="employee-avatar">
                              <div className="avatar-circle">
                                {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <div className="employee-details">
                              <span className="employee-name">{employee.name}</span>
                              <span className="employee-role">{employee.role}</span>
                            </div>
                            <span className="employee-salary">{formatCurrency(employee.baseSalary)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="bi bi-people"></i>
                      </div>
                      <p>No employee data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Payment Types Distribution */}
              <div className="payment-types card">
                <div className="card-header">
                  <h2>Payment Types</h2>
                </div>
                <div className="card-body">
                  {salaries.length > 0 ? (
                    <div className="payment-types-stats">
                      <div className="donut-chart">
                        <div className="donut-segment" style={{
                          '--percentage': `${(salaries.filter(s => s.paymentType === 'salary').length / salaries.length) * 100}%`,
                          '--color': '#4cc9f0'
                        } as React.CSSProperties}>
                          <span className="donut-label">
                            {Math.round((salaries.filter(s => s.paymentType === 'salary').length / salaries.length) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="payment-types-breakdown">
                        <div className="type-item">
                          <div className="type-color" style={{ backgroundColor: '#4cc9f0' }}></div>
                          <div className="type-details">
                            <span className="type-name">Monthly Salary</span>
                            <span className="type-count">
                              {salaries.filter(s => s.paymentType === 'salary').length} payments
                            </span>
                          </div>
                          <span className="type-amount">
                            {formatCurrency(
                              salaries
                                .filter(s => s.paymentType === 'salary')
                                .reduce((sum, s) => sum + s.amount, 0)
                            )}
                          </span>
                        </div>
                        <div className="type-item">
                          <div className="type-color" style={{ backgroundColor: '#f72585' }}></div>
                          <div className="type-details">
                            <span className="type-name">Daily Credit</span>
                            <span className="type-count">
                              {salaries.filter(s => s.paymentType === 'daily_credit').length} payments
                            </span>
                          </div>
                          <span className="type-amount">
                            {formatCurrency(
                              salaries
                                .filter(s => s.paymentType === 'daily_credit')
                                .reduce((sum, s) => sum + s.amount, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="bi bi-pie-chart"></i>
                      </div>
                      <p>No payment data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="quick-actions card">
                <div className="card-header">
                  <h2>Quick Actions</h2>
                </div>
                <div className="card-body">
                  <div className="action-buttons">
                    <button className="action-button" onClick={() => setActiveTab('add')}>
                      <div className="action-icon">
                        <i className="bi bi-plus-circle"></i>
                      </div>
                      <span>New Payment</span>
                    </button>
                    <button className="action-button" onClick={exportToCsv}>
                      <div className="action-icon">
                        <i className="bi bi-file-earmark-spreadsheet"></i>
                      </div>
                      <span>Export Report</span>
                    </button>
                    <button className="action-button" onClick={printReport}>
                      <div className="action-icon">
                        <i className="bi bi-printer"></i>
                      </div>
                      <span>Print Report</span>
                    </button>
                    <label className="action-button">
                      <div className="action-icon">
                        <i className="bi bi-upload"></i>
                      </div>
                      <span>Bulk Upload</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* History Tab - Only show when not loading */}
        {!showLoading && activeTab === 'history' && (
          <div className="history-container" id="history-tab">
            {/* Filters */}
            <div className="filter-bar">
              <div className="search-container">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              
              <div className={`advanced-filters ${showFilters ? 'show' : ''}`}>
                <div className="filter-group">
                  <label htmlFor="dateFilter">Date</label>
                  <input
                    type="date"
                    id="dateFilter"
                    className="filter-input"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label htmlFor="employeeFilter">Employee</label>
                  <select
                    id="employeeFilter"
                    className="filter-input"
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <option value="">All Employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="typeFilter">Type</label>
                  <select
                    id="typeFilter"
                    className="filter-input"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="salary">Monthly Salary</option>
                    <option value="daily_credit">Daily Credit</option>
                  </select>
                </div>
                
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetFilters}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              </div>
              
              <div className="filter-actions">
                <button 
                  className={`btn btn-filter ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <i className="bi bi-funnel"></i>
                  <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
                
                <select className="entries-select">
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
            
            {/* Applied Filters */}
            {(searchTerm || dateFilter || employeeFilter || typeFilter) && (
              <div className="applied-filters">
                <div className="filter-tags">
                  <span className="filter-label">Active filters:</span>
                  
                  {searchTerm && (
                    <div className="filter-tag">
                      <i className="bi bi-search"></i>
                      <span>"{searchTerm}"</span>
                      <button onClick={() => setSearchTerm('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                  
                  {dateFilter && (
                    <div className="filter-tag">
                      <i className="bi bi-calendar-event"></i>
                      <span>Date: {formatDate(dateFilter)}</span>
                      <button onClick={() => setDateFilter('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                  
                  {employeeFilter !== '' && (
                    <div className="filter-tag">
                      <i className="bi bi-person"></i>
                      <span>Employee: {getEmployeeName(Number(employeeFilter))}</span>
                      <button onClick={() => setEmployeeFilter('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                  
                  {typeFilter && (
                    <div className="filter-tag">
                      <i className="bi bi-tag"></i>
                      <span>Type: {typeFilter === 'salary' ? 'Monthly Salary' : 'Daily Credit'}</span>
                      <button onClick={() => setTypeFilter('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetFilters}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset All
                </button>
              </div>
            )}
            
            {/* Salary Table */}
            <div className="salary-table-container">
              {filteredSalaries.length > 0 ? (
                <table className="salary-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Date Paid</th>
                      <th>Payment Type</th>
                      <th>Amount</th>
                      <th>Last Salary Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalaries.map((salary) => (
                      <tr key={salary.id} className="salary-row">
                        <td className="salary-id">{salary.id}</td>
                        <td className="employee-name">
                          <div className="employee-cell">
                            <div className="avatar-circle small">
                              {getEmployeeName(salary.employeeId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span>{getEmployeeName(salary.employeeId)}</span>
                          </div>
                        </td>
                        <td className="date-paid">{formatDate(salary.datePaid)}</td>
                        <td className="payment-type">
                          <span className={`badge ${salary.paymentType === 'salary' ? 'salary' : 'daily-credit'}`}>
                            {salary.paymentType === 'salary' ? 'Monthly Salary' : 'Daily Credit'}
                          </span>
                        </td>
                        <td className="amount">{formatCurrency(salary.amount)}</td>
                        <td className="last-salary-date">{formatDate(salary.lastSalaryDate)}</td>
                        <td className="actions">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => handleViewSalary(salary)}
                            aria-label="View payment details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => confirmDelete(salary)}
                            aria-label="Delete payment"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <h3>No Salary Payments Found</h3>
                  <p>No salary payments match your current criteria.</p>
                  
                  {(searchTerm || dateFilter || employeeFilter || typeFilter) && (
                    <button 
                      className="btn btn-outline-primary"
                      onClick={resetFilters}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {filteredSalaries.length > 0 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing <span className="fw-bold">1</span> to <span className="fw-bold">{filteredSalaries.length}</span> of <span className="fw-bold">{filteredSalaries.length}</span> entries
                </div>
                <div className="pagination-controls">
                  <button className="page-btn disabled" disabled>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn disabled" disabled>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Add Payment Tab - Only show when not loading */}
        {!showLoading && activeTab === 'add' && (
          <div className="add-payment-container" id="add-tab">
            <div className="form-container">
              <div className="form-header">
                <h2><i className="bi bi-plus-circle"></i> Add New Salary Payment</h2>
                <p>Enter the details below to record a new salary payment</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Employee Selection */}
                  <div className="form-group">
                    <label htmlFor="employeeId">
                      <i className="bi bi-person"></i> Select Employee <span className="required">*</span>
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      className="form-control"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select an employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date Paid */}
                  <div className="form-group">
                    <label htmlFor="datePaid">
                      <i className="bi bi-calendar-check"></i> Payment Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="datePaid"
                      name="datePaid"
                      className="form-control"
                      value={formData.datePaid}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  {/* Payment Type */}
                  <div className="form-group">
                    <label htmlFor="paymentType">
                      <i className="bi bi-tag"></i> Payment Type <span className="required">*</span>
                    </label>
                    <div className="payment-type-toggle">
                      <input
                        type="radio"
                        id="typeSalary"
                        name="paymentType"
                        value="salary"
                        checked={formData.paymentType === 'salary'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="typeSalary" className={formData.paymentType === 'salary' ? 'active' : ''}>
                        <i className="bi bi-wallet2"></i> Monthly Salary
                      </label>
                      
                      <input
                        type="radio"
                        id="typeCredit"
                        name="paymentType"
                        value="daily_credit"
                        checked={formData.paymentType === 'daily_credit'}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="typeCredit" className={formData.paymentType === 'daily_credit' ? 'active' : ''}>
                        <i className="bi bi-cash-coin"></i> Daily Credit
                      </label>
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div className="form-group">
                    <label htmlFor="amount">
                      <i className="bi bi-cash"></i> Amount <span className="required">*</span>
                    </label>
                    <div className="amount-input">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        className="form-control"
                        value={formData.amount === 0 ? '' : formData.amount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {formData.amount > 0 && (
                      <div className="amount-preview">
                        {formatCurrency(formData.amount)}
                      </div>
                    )}
                  </div>
                  
                  {/* Last Salary Date (optional) */}
                  <div className="form-group">
                    <label htmlFor="lastSalaryDate">
                      <i className="bi bi-calendar-event"></i> Last Salary Date
                    </label>
                    <input
                      type="date"
                      id="lastSalaryDate"
                      name="lastSalaryDate"
                      className="form-control"
                      value={formData.lastSalaryDate || ''}
                      onChange={handleInputChange}
                      max={formData.datePaid}
                    />
                    <div className="help-text">
                      Optional. If not specified, will default to one month before payment date.
                    </div>
                  </div>
                  
                  {/* Payment Preview */}
                  {formData.employeeId && (
                    <div className="payment-preview">
                      <h3>Payment Preview</h3>
                      <div className="preview-details">
                        <div className="preview-row">
                          <span className="preview-label">Employee:</span>
                          <span className="preview-value">
                            {typeof formData.employeeId === 'number' ? getEmployeeName(formData.employeeId) : ''}
                          </span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Payment Type:</span>
                          <span className="preview-value">
                            {formData.paymentType === 'salary' ? 'Monthly Salary' : 'Daily Credit'}
                          </span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Amount:</span>
                          <span className="preview-value amount">
                            {formatCurrency(formData.amount)}
                          </span>
                        </div>
                        <div className="preview-row">
                          <span className="preview-label">Payment Date:</span>
                          <span className="preview-value">
                            {formData.datePaid ? formatDate(formData.datePaid) : 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setActiveTab('history')}
                  >
                    <i className="bi bi-x-circle"></i> Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || showLoading}
                  >
                    {isSubmitting || showLoading ? (
                      <>
                        <div className="spinner">
                          <div className="bounce1"></div>
                          <div className="bounce2"></div>
                          <div className="bounce3"></div>
                        </div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Record Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="quick-tips">
              <div className="tips-header">
                <h3><i className="bi bi-lightbulb"></i> Tips</h3>
              </div>
              <div className="tips-body">
                <div className="tip-item">
                  <div className="tip-icon">
                    <i className="bi bi-info-circle"></i>
                  </div>
                  <p>
                    <strong>Monthly Salary</strong> is typically used for regular end-of-month payments.
                  </p>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">
                    <i className="bi bi-info-circle"></i>
                  </div>
                  <p>
                    <strong>Daily Credit</strong> is for advances or partial payments made during the month.
                  </p>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">
                    <i className="bi bi-upload"></i>
                  </div>
                  <p>
                    For multiple payments, you can use the <strong>Bulk Upload</strong> feature with a CSV file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Salary Modal */}
      {showViewModal && selectedSalary && (
        <div className="modal-overlay">
          <div className="modal-container view-modal">
            <div className="modal-header">
              <h3>
                <i className="bi bi-cash-stack"></i> 
                {isEditMode ? 'Edit Salary Payment' : 'Salary Payment Details'}
              </h3>
              <button className="close-btn" onClick={closeViewModal}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {!isEditMode ? (
                // View Mode
                <div className="salary-details">
                  <div className="detail-section">
                    <h4><i className="bi bi-person"></i> Employee Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Employee Name:</span>
                        <span className="detail-value">{getEmployeeName(selectedSalary.employeeId)}</span>
                      </div>
                      {getEmployeeDetails(selectedSalary.employeeId) && (
                        <>
                          <div className="detail-item">
                            <span className="detail-label">Role:</span>
                            <span className="detail-value">{getEmployeeDetails(selectedSalary.employeeId)?.role}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Base Salary:</span>
                            <span className="detail-value">{formatCurrency(getEmployeeDetails(selectedSalary.employeeId)?.baseSalary || 0)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4><i className="bi bi-cash"></i> Payment Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Payment ID:</span>
                        <span className="detail-value">{selectedSalary.id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Payment Type:</span>
                        <span className="detail-value">
                          <span className={`badge ${selectedSalary.paymentType === 'salary' ? 'salary' : 'daily-credit'}`}>
                            {selectedSalary.paymentType === 'salary' ? 'Monthly Salary' : 'Daily Credit'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value amount">{formatCurrency(selectedSalary.amount)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date Paid:</span>
                        <span className="detail-value">{formatDate(selectedSalary.datePaid)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Salary Date:</span>
                        <span className="detail-value">
                          {selectedSalary.lastSalaryDate ? formatDate(selectedSalary.lastSalaryDate) : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleUpdateSalary}>
                  <div className="edit-form-grid">
                    <div className="form-group">
                      <label htmlFor="editEmployeeId">
                        <i className="bi bi-person"></i> Employee <span className="required">*</span>
                      </label>
                      <select
                        id="editEmployeeId"
                        name="employeeId"
                        className="form-control"
                        value={editFormData.employeeId}
                        onChange={handleEditInputChange}
                        required
                      >
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} - {employee.role}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="editDatePaid">
                        <i className="bi bi-calendar-check"></i> Payment Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="editDatePaid"
                        name="datePaid"
                        className="form-control"
                        value={editFormData.datePaid}
                        onChange={handleEditInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="editPaymentType">
                        <i className="bi bi-tag"></i> Payment Type <span className="required">*</span>
                      </label>
                      <div className="payment-type-toggle">
                        <input
                          type="radio"
                          id="editTypeSalary"
                          name="paymentType"
                          value="salary"
                          checked={editFormData.paymentType === 'salary'}
                          onChange={handleEditInputChange}
                        />
                        <label htmlFor="editTypeSalary" className={editFormData.paymentType === 'salary' ? 'active' : ''}>
                          <i className="bi bi-wallet2"></i> Monthly Salary
                        </label>
                        
                        <input
                          type="radio"
                          id="editTypeCredit"
                          name="paymentType"
                          value="daily_credit"
                          checked={editFormData.paymentType === 'daily_credit'}
                          onChange={handleEditInputChange}
                        />
                        <label htmlFor="editTypeCredit" className={editFormData.paymentType === 'daily_credit' ? 'active' : ''}>
                          <i className="bi bi-cash-coin"></i> Daily Credit
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="editAmount">
                        <i className="bi bi-cash"></i> Amount <span className="required">*</span>
                      </label>
                      <div className="amount-input">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          id="editAmount"
                          name="amount"
                          className="form-control"
                          value={editFormData.amount === 0 ? '' : editFormData.amount}
                          onChange={handleEditInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="editLastSalaryDate">
                        <i className="bi bi-calendar-event"></i> Last Salary Date
                      </label>
                      <input
                        type="date"
                        id="editLastSalaryDate"
                        name="lastSalaryDate"
                        className="form-control"
                        value={editFormData.lastSalaryDate}
                        onChange={handleEditInputChange}
                        max={editFormData.datePaid}
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
            
            <div className="modal-footer">
              {!isEditMode ? (
                // View Mode Actions
                <>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={closeViewModal}
                  >
                    <i className="bi bi-x-circle"></i> Close
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleEditSalary(selectedSalary)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => confirmDelete(selectedSalary)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </>
              ) : (
                // Edit Mode Actions
                <>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setIsEditMode(false)}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-x-circle"></i> Cancel Edit
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handleUpdateSalary}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner">
                          <div className="bounce1"></div>
                          <div className="bounce2"></div>
                          <div className="bounce3"></div>
                        </div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Save Changes
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Confirm Delete</h3>
              <button className="close-btn" onClick={cancelDelete}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this salary payment?</p>
              {salaryToDelete && (
                <div className="delete-details">
                  <div className="detail-row">
                    <span className="detail-label">Employee:</span>
                    <span className="detail-value">{getEmployeeName(salaryToDelete.employeeId)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{formatCurrency(salaryToDelete.amount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(salaryToDelete.datePaid)}</span>
                  </div>
                </div>
              )}
              <p className="text-danger">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={cancelDelete}>
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={isSubmitting || showLoading}
              >
                {isSubmitting || showLoading ? (
                  <>
                    <div className="spinner">
                      <div className="bounce1"></div>
                      <div className="bounce2"></div>
                      <div className="bounce3"></div>
                    </div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash"></i> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="toast-notification">
          <div className="toast-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="toast-content">
            <p>{successMessage}</p>
          </div>
          <button 
            className="toast-close"
            onClick={() => setShowSuccessToast(false)}
            aria-label="Close notification"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;