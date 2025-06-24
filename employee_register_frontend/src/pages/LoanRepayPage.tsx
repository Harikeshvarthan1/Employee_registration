// src/pages/LoanRepayPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getActiveLoansByEmployeeId, 
  getActiveLoans 
} from '../apis/loanRegistrationApi';
import { 
  addRepayment, 
  getRepaymentsByEmployeeId, 
  getRepaymentsByLoanId,
  deleteRepayment,
  getTotalRepaidForLoan,
  getAllRepayments
} from '../apis/loanRepayApi';
import { 
  getAllActiveEmployees} from '../apis/employeeApi';
import type { LoanRegistration, LoanRepay, Employee } from '../models/types';
import './LoanRepayPage.css';

const LoanRepayPage: React.FC = () => {
  // Auth context
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management for loans and repayments
  const [activeLoans, setActiveLoans] = useState<LoanRegistration[]>([]);
  const [repayments, setRepayments] = useState<LoanRepay[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanRegistration | null>(null);
  const [selectedRepayment, setSelectedRepayment] = useState<LoanRepay | null>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRepaymentForm, setShowRepaymentForm] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepay | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  
  // Payment amount validation states
  const [amountError, setAmountError] = useState<string | null>(null);
  const [currentRemainingBalance, setCurrentRemainingBalance] = useState<number>(0);
  const [isAmountValid, setIsAmountValid] = useState<boolean>(false);
  
  // Triple tap functionality states
  const [, setTapCount] = useState<number>(0);
  const [showSecretMessage, setShowSecretMessage] = useState<boolean>(false);
  
  // Determine if we should show loading state (either loading or error occurred)
  const showLoading = isLoading || error !== null;
  
  // Refs for scroll
  const formRef = useRef<HTMLDivElement>(null);
  
  // Repayment form state
  const [repaymentForm, setRepaymentForm] = useState({
    loanId: 0,
    employeeId: 0,
    repayAmount: 0,
    repayDate: new Date().toISOString().split('T')[0]
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalLoansAmount: 0,
    totalRepaidAmount: 0,
    remainingAmount: 0,
    activeLoansCount: 0,
    averageRepayment: 0,
    repaymentCount: 0,
  });
  
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
  
  // Load initial data
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
  }, [currentUser, navigate]);
  
  // Load all data - both admin and users have full access
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all employees and loans data
      let employeeData: Employee[] = [];
      let loansData: LoanRegistration[] = [];
      let repaymentsData: LoanRepay[] = [];
      
      // Load all active employees
      employeeData = await getAllActiveEmployees();
      
      // Initial load - all active loans
      loansData = await getActiveLoans();
      
      // For repayments, filter by employee if selected, otherwise get all
      if (filterEmployee) {
        repaymentsData = await getRepaymentsByEmployeeId(filterEmployee);
      } else {
        // Get all repayments
        repaymentsData = await getAllRepayments();
      }
      
      setEmployees(employeeData);
      setActiveLoans(loansData);
      setRepayments(repaymentsData);
      
      // Calculate statistics
      calculateStats(loansData, repaymentsData);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      // Don't set isLoading to false when there's an error
      // This will keep the loading state active
    }
  };
  
  // Calculate statistics from loans and repayments
  const calculateStats = (loans: LoanRegistration[], repayments: LoanRepay[]) => {
    const totalLoans = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const totalRepaid = repayments.reduce((sum, repay) => sum + repay.repayAmount, 0);
    const remaining = Math.max(totalLoans - totalRepaid, 0);
    const avgRepayment = repayments.length > 0 ? totalRepaid / repayments.length : 0;
    
    setStats({
      totalLoansAmount: totalLoans,
      totalRepaidAmount: totalRepaid,
      remainingAmount: remaining,
      activeLoansCount: loans.length,
      averageRepayment: avgRepayment,
      repaymentCount: repayments.length,
    });
  };
  
  // Handle employee filter change
  const handleEmployeeFilterChange = async (employeeId: number | null) => {
    setFilterEmployee(employeeId);
    
    if (employeeId) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load loans and repayments for selected employee
        const [loans, repayments] = await Promise.all([
          getActiveLoansByEmployeeId(employeeId),
          getRepaymentsByEmployeeId(employeeId)
        ]);
        
        setActiveLoans(loans);
        setRepayments(repayments);
        calculateStats(loans, repayments);
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error filtering by employee:', err);
        setError(err.message || 'Failed to filter by employee');
        // Don't set isLoading to false when there's an error
      }
    } else {
      // Reset to show all data
      loadData();
    }
  };
  
  // Calculate remaining balance for a specific loan
  const calculateRemainingBalance = async (loan: LoanRegistration): Promise<number> => {
    try {
      const totalRepaid = await getTotalRepaidForLoan(loan.loanId ?? 0);
      return Math.max(loan.loanAmount - totalRepaid, 0);
    } catch (error) {
      console.error('Error calculating remaining balance:', error);
      // Fallback: calculate from local repayments data
      const loanRepayments = repayments.filter(r => r.loanId === loan.loanId);
      const totalRepaid = loanRepayments.reduce((sum, r) => sum + r.repayAmount, 0);
      return Math.max(loan.loanAmount - totalRepaid, 0);
    }
  };
  
  // Enhanced validation - ensures payment amount is less than or equal to remaining balance
  const validatePaymentAmount = (amount: number, remainingBalance: number) => {
    setAmountError(null);
    setIsAmountValid(false);
    
    // Round to 2 decimal places to handle floating point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;
    const roundedBalance = Math.round(remainingBalance * 100) / 100;
    
    if (roundedAmount <= 0) {
      setAmountError('Payment amount must be greater than zero');
      return false;
    }
    
    // Check if amount exceeds remaining balance (allowing equal amounts)
    if (roundedAmount > roundedBalance) {
      setAmountError(`Payment amount must be less than or equal to remaining balance of ${formatCurrency(remainingBalance)}`);
      return false;
    }
    
    // Special check for when remaining balance is zero
    if (roundedBalance <= 0) {
      setAmountError('This loan has been fully repaid. No additional payments allowed.');
      return false;
    }
    
    setIsAmountValid(true);
    return true;
  };
  
  // Select a loan for repayment
  const selectLoanForRepayment = async (loan: LoanRegistration) => {
    setSelectedLoan(loan);
    
    // Calculate and set current remaining balance
    const remainingBalance = await calculateRemainingBalance(loan);
    setCurrentRemainingBalance(remainingBalance);
    
    // Initialize form with loan data
    setRepaymentForm({
      loanId: loan.loanId ?? 0,
      employeeId: loan.employeeId,
      repayAmount: 0,
      repayDate: new Date().toISOString().split('T')[0]
    });
    
    // Reset validation states
    setAmountError(null);
    setIsAmountValid(false);
    
    setShowRepaymentForm(true);
    
    // Smooth scroll to form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    try {
      // Load loan repayments history
      const repayments = await getRepaymentsByLoanId(loan.loanId ?? 0);
      setRepayments(repayments);
    } catch (err) {
      console.error('Error loading loan repayments:', err);
    }
  };
  
  // Handle form input changes with enhanced real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setRepaymentForm(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Real-time validation for payment amount with enhanced checking
    if (name === 'repayAmount' && type === 'number') {
      const amount = parseFloat(value) || 0;
      validatePaymentAmount(amount, currentRemainingBalance);
    }
  };
  
  // Submit repayment form with enhanced validation
  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoan) {
      setError('No loan selected');
      return;
    }
    
    // Enhanced final validation before submission
    const roundedAmount = Math.round(repaymentForm.repayAmount * 100) / 100;
    const roundedBalance = Math.round(currentRemainingBalance * 100) / 100;
    
    if (!isAmountValid || roundedAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    
    if (roundedAmount > roundedBalance) {
      setError(`Payment amount must be less than or equal to remaining balance of ${formatCurrency(currentRemainingBalance)}`);
      return;
    }
    
    if (roundedBalance <= 0) {
      setError('This loan has been fully repaid. No additional payments allowed.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Submit repayment
      const newRepayment = await addRepayment(repaymentForm);
      
      // Update state with new repayment
      setRepayments(prev => [newRepayment, ...prev]);
      
      // Reset form
      setRepaymentForm({
        loanId: selectedLoan.loanId ?? 0,
        employeeId: selectedLoan.employeeId,
        repayAmount: 0,
        repayDate: new Date().toISOString().split('T')[0]
      });
      
      // Reset validation states
      setAmountError(null);
      setIsAmountValid(false);
      
      // Show success message
      setSuccessMessage('Repayment recorded successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Update current remaining balance
      const newRemainingBalance = Math.max(currentRemainingBalance - repaymentForm.repayAmount, 0);
      setCurrentRemainingBalance(newRemainingBalance);
      
      // If loan is fully paid, close the form
      if (newRemainingBalance <= 0) {
        setShowRepaymentForm(false);
        setSuccessMessage('Loan has been fully repaid!');
      }
      
      // Reload data to update statistics
      loadData();
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error submitting repayment:', err);
      setError(err.message || 'Failed to submit repayment');
      // Don't set isLoading to false when there's an error
    }
  };
  
  // View repayment details
  const viewRepaymentDetails = (repayment: LoanRepay) => {
    setSelectedRepayment(repayment);
  };
  
  // Prepare to delete repayment
  const confirmDeleteRepayment = (repayment: LoanRepay) => {
    setRepaymentToDelete(repayment);
    setShowDeleteConfirmation(true);
  };
  
  // Delete repayment
  const handleDeleteRepayment = async () => {
    if (!repaymentToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (repaymentToDelete?.id !== undefined) {
        await deleteRepayment(repaymentToDelete.id);
      } else {
        console.error('Repayment ID is undefined');
      }
      
      // Update state
      setRepayments(prev => prev.filter(r => r.id !== repaymentToDelete.id));
      
      // Update remaining balance if this repayment was for the currently selected loan
      if (selectedLoan && repaymentToDelete.loanId === selectedLoan.loanId) {
        const newRemainingBalance = currentRemainingBalance + repaymentToDelete.repayAmount;
        setCurrentRemainingBalance(newRemainingBalance);
        
        // Re-validate current amount if form is open
        if (showRepaymentForm && repaymentForm.repayAmount > 0) {
          validatePaymentAmount(repaymentForm.repayAmount, newRemainingBalance);
        }
      }
      
      // Close modal
      setShowDeleteConfirmation(false);
      setRepaymentToDelete(null);
      
      // Show success message
      setSuccessMessage('Repayment deleted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Reload data to update statistics
      loadData();
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error deleting repayment:', err);
      setError(err.message || 'Failed to delete repayment');
      // Don't set isLoading to false when there's an error
    }
  };
  
  // Calculate repayment progress for a loan
  const calculateProgress = (loan: LoanRegistration) => {
    const loanRepayments = repayments.filter(r => r.loanId === loan.loanId);
    const totalRepaid = loanRepayments.reduce((sum, r) => sum + r.repayAmount, 0);
    const progress = Math.min(Math.round((totalRepaid / loan.loanAmount) * 100), 100);
    
    return {
      progress,
      totalRepaid,
      remaining: Math.max(loan.loanAmount - totalRepaid, 0)
    };
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
  
  // Get employee name by ID
  const getEmployeeName = (employeeId: number): string => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };
  
  return (
    <div className="loan-repay-page">
      
      <main className="loan-repay-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Loan Repayments</h1>
            <p className="page-description">
              Record loan repayments and track repayment progress
            </p>
          </div>
          
          {!showLoading && (
            <div className="employee-select-container">
              <label htmlFor="employeeFilter">Manage repayments for:</label>
              <select 
                id="employeeFilter"
                value={filterEmployee || ''}
                onChange={(e) => handleEmployeeFilterChange(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Success message */}
        {successMessage && !showLoading && (
          <div className="success-container">
            <div className="success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="success-content">
              <h3>Success</h3>
              <p>{successMessage}</p>
            </div>
            <button 
              className="success-dismiss"
              onClick={() => setSuccessMessage(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        
        {/* Loading state - Modified to include triple tap functionality */}
        {showLoading && (
          <div className="loading-container">
            <div className="loading-content" onClick={handleLoaderTap}>
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h3>Loading Loan Data</h3>
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
        
        {/* Dashboard Statistics */}
        {!showLoading && (
          <div className="dashboard-section">
            <div className="stats-grid">
              <div className="stat-card active-loans">
                <div className="stat-icon">
                  <i className="bi bi-credit-card-fill"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.activeLoansCount}</div>
                  <div className="stat-label">Active Loans</div>
                  <div className="stat-meta">
                    Total value: {formatCurrency(stats.totalLoansAmount)}
                  </div>
                </div>
              </div>
              
              <div className="stat-card repaid-amount">
                <div className="stat-icon">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(stats.totalRepaidAmount)}</div>
                  <div className="stat-label">Total Repaid</div>
                  <div className="stat-meta">
                    Over {stats.repaymentCount} payments
                  </div>
                </div>
              </div>
              
              <div className="stat-card remaining-amount">
                <div className="stat-icon">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(stats.remainingAmount)}</div>
                  <div className="stat-label">Remaining Balance</div>
                  <div className="stat-meta">
                    {stats.totalLoansAmount > 0 ? 
                      `${Math.round((stats.totalRepaidAmount / stats.totalLoansAmount) * 100)}% paid` : 
                      'No active loans'}
                  </div>
                </div>
              </div>
              
              <div className="stat-card average-payment">
                <div className="stat-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(stats.averageRepayment)}</div>
                  <div className="stat-label">Average Payment</div>
                  <div className="stat-meta">
                    Per repayment transaction
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* View Toggle */}
        {!showLoading && (
          <div className="view-toggle-container">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'active' ? 'active' : ''}`}
                onClick={() => setViewMode('active')}
              >
                <i className="bi bi-credit-card-2-front"></i>
                Active Loans
              </button>
              <button 
                className={`view-btn ${viewMode === 'history' ? 'active' : ''}`}
                onClick={() => setViewMode('history')}
              >
                <i className="bi bi-clock-history"></i>
                Repayment History
              </button>
            </div>
          </div>
        )}
        
        {/* Repayment Form */}
        {!showLoading && showRepaymentForm && selectedLoan && (
          <div className="repayment-form-section" ref={formRef}>
            <div className="section-header">
              <h2>
                <i className="bi bi-wallet"></i>
                Record Loan Repayment
              </h2>
              <button 
                className="close-form-btn"
                onClick={() => {
                  setShowRepaymentForm(false);
                  setAmountError(null);
                  setIsAmountValid(false);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className="loan-summary">
              <div className="loan-summary-header">
                <div className="loan-employee">
                  <div className="employee-avatar">
                    {getEmployeeName(selectedLoan.employeeId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <span className="employee-name">{getEmployeeName(selectedLoan.employeeId)}</span>
                    <span className="loan-date">Loan date: {formatDate(selectedLoan.loanDate)}</span>
                  </div>
                </div>
                <div className="loan-amount-info">
                  <div className="loan-amount-label">Original Loan</div>
                  <div className="loan-amount-value">{formatCurrency(selectedLoan.loanAmount)}</div>
                </div>
              </div>
              
              <div className="loan-balance-info">
                {(() => {
                  const { progress, totalRepaid } = calculateProgress(selectedLoan);
                  return (
                    <>
                      <div className="progress-container">
                        <div className="progress-stats">
                          <div className="progress-label">Repayment Progress</div>
                          <div className="progress-percentage">{progress}%</div>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="balance-grid">
                        <div className="balance-item">
                          <div className="balance-label">Already Paid</div>
                          <div className="balance-value repaid">{formatCurrency(totalRepaid)}</div>
                        </div>
                        <div className="balance-item">
                          <div className="balance-label">Remaining Balance</div>
                          <div className="balance-value remaining">{formatCurrency(currentRemainingBalance)}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <form onSubmit={handleSubmitRepayment} className="repayment-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="repayAmount">
                    <i className="bi bi-cash"></i>
                    Payment Amount <span className="required">*</span>
                  </label>
                  <div className="currency-input">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      id="repayAmount"
                      name="repayAmount"
                      value={repaymentForm.repayAmount === 0 ? '' : repaymentForm.repayAmount}
                      onChange={handleInputChange}
                      min="0.01"
                      max={currentRemainingBalance}
                      step="0.01"
                      className={amountError ? 'error' : ''}
                      disabled={currentRemainingBalance <= 0}
                      required
                    />
                  </div>

                  {/* Enhanced real-time amount validation feedback */}
                  {amountError && (
                    <div className="validation-error">
                      <i className="bi bi-exclamation-circle"></i>
                      <span>{amountError}</span>
                    </div>
                  )}

                  {repaymentForm.repayAmount > 0 && !amountError && (
                    <div className="amount-preview">
                      <div className="amount-display">{formatCurrency(repaymentForm.repayAmount)}</div>
                      <div className="remaining-after">
                        Remaining after payment: {formatCurrency(Math.max(currentRemainingBalance - repaymentForm.repayAmount, 0))}
                      </div>
                      {Math.max(currentRemainingBalance - repaymentForm.repayAmount, 0) === 0 && (
                        <div className="full-payment-notice">
                          <i className="bi bi-check-circle"></i>
                          This payment will fully settle the loan!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced maximum amount hint */}
                  <div className="amount-hint">
                    <i className="bi bi-info-circle"></i>
                    {currentRemainingBalance > 0 ? (
                      <>Maximum payable amount: {formatCurrency(currentRemainingBalance)}</>
                    ) : (
                      <>This loan has been fully repaid</>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="repayDate">
                    <i className="bi bi-calendar-event"></i>
                    Payment Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="repayDate"
                    name="repayDate"
                    value={repaymentForm.repayDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowRepaymentForm(false);
                    setAmountError(null);
                    setIsAmountValid(false);
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !isAmountValid || repaymentForm.repayAmount <= 0 || !!amountError || currentRemainingBalance <= 0}
                >
                  <i className="bi bi-check-circle"></i>
                  Record Payment
                  {(!isAmountValid || !!amountError || currentRemainingBalance <= 0) && (
                    <span className="button-hint">
                      {currentRemainingBalance <= 0 ? ' - Loan fully paid' : ' - Enter valid amount'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Active Loans Section */}
        {!showLoading && viewMode === 'active' && (
          <div className="loans-section">
            <div className="section-header">
              <h2>
                <i className="bi bi-credit-card-2-front"></i>
                Active Loans
              </h2>
            </div>
            
            {activeLoans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-credit-card"></i>
                </div>
                <h3>No Active Loans</h3>
                <p>
                  {filterEmployee ? 
                    'The selected employee has no active loans.' : 
                    'There are no active loans in the system.'}
                </p>
              </div>
            ) : (
              <div className="loans-grid">
                {activeLoans.map(loan => {
                  const { progress, remaining } = calculateProgress(loan);
                  
                  return (
                    <div key={loan.loanId} className="loan-card">
                      <div className="loan-header">
                        <div className="loan-id">Loan #{loan.loanId}</div>
                        <div className="loan-employee-info">
                          <div className="employee-avatar">
                            {getEmployeeName(loan.employeeId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="employee-name">{getEmployeeName(loan.employeeId)}</span>
                        </div>
                      </div>
                      
                      <div className="loan-details">
                        <div className="amount-row">
                          <div className="loan-total">
                            <div className="amount-label">Total Loan</div>
                            <div className="amount-value">{formatCurrency(loan.loanAmount)}</div>
                          </div>
                          <div className="loan-remaining">
                            <div className="amount-label">Remaining</div>
                            <div className="amount-value">{formatCurrency(remaining)}</div>
                          </div>
                        </div>
                        
                        <div className="progress-container">
                          <div className="progress-label">
                            <span>Repayment Progress</span>
                            <span className="progress-percentage">{progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="loan-info-row">
                          <div className="loan-info-item">
                            <i className="bi bi-calendar-date"></i>
                            <span>{formatDate(loan.loanDate)}</span>
                          </div>
                          <div className="loan-info-item">
                            <i className="bi bi-chat-left-text"></i>
                            <span>{loan.reason.length > 20 ? `${loan.reason.substring(0, 20)}...` : loan.reason}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="loan-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => selectLoanForRepayment(loan)}
                          disabled={remaining <= 0}
                        >
                          <i className="bi bi-wallet"></i>
                          {remaining <= 0 ? 'Fully Paid' : 'Make Payment'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Repayment History Section */}
        {!showLoading && viewMode === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <h2>
                <i className="bi bi-clock-history"></i>
                Repayment History
              </h2>
            </div>
            
            {repayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-hourglass"></i>
                </div>
                <h3>No Repayment History</h3>
                <p>
                  {filterEmployee ? 
                    'No repayments recorded for the selected employee yet.' : 
                    'No repayments have been recorded in the system.'}
                </p>
              </div>
            ) : (
              <div className="repayments-table-container">
                <table className="repayments-table">
                  <thead>
                    <tr>
                      <th>Repayment Date</th>
                      <th>Employee</th>
                      <th>Loan ID</th>
                      <th>Amount Paid</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repayments.map(repayment => (
                      <tr key={repayment.id}>
                        <td className="date-cell">
                          <div className="date-primary">{formatDate(repayment.repayDate)}</div>
                          <div className="date-secondary">
                            {new Date(repayment.repayDate).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td className="employee-cell">
                          <div className="cell-avatar">
                            {getEmployeeName(repayment.employeeId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="cell-text">
                            {getEmployeeName(repayment.employeeId)}
                          </div>
                        </td>
                        <td className="loan-id-cell">#{repayment.loanId}</td>
                        <td className="amount-cell">{formatCurrency(repayment.repayAmount)}</td>
                        <td className="actions-cell">
                          <button 
                            className="action-btn view"
                            onClick={() => viewRepaymentDetails(repayment)}
                            title="View details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          
                          <button 
                            className="action-btn delete"
                            onClick={() => confirmDeleteRepayment(repayment)}
                            title="Delete repayment"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Confirm Delete</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setRepaymentToDelete(null);
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>
                Are you sure you want to delete this repayment of
                <strong> {repaymentToDelete ? formatCurrency(repaymentToDelete.repayAmount) : ''}</strong>?
              </p>
              <p className="warning-text">
                <i className="bi bi-exclamation-circle"></i>
                This action cannot be undone. Deleting this repayment will adjust the loan balance accordingly.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setRepaymentToDelete(null);
                }}
              >
                Cancel
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={handleDeleteRepayment}
              >
                <i className="bi bi-trash"></i>
                Delete Repayment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Repayment Details Modal */}
      {selectedRepayment && (
        <div className="modal-overlay" onClick={() => setSelectedRepayment(null)}>
          <div className="modal-container repayment-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-receipt"></i> Repayment Details</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedRepayment(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-card">
                <div className="receipt-number">Receipt #R-{selectedRepayment.id}</div>
                
                <div className="receipt-details">
                  <div className="receipt-row">
                    <div className="receipt-label">Employee</div>
                    <div className="receipt-value">{getEmployeeName(selectedRepayment.employeeId)}</div>
                  </div>
                  
                  <div className="receipt-row">
                    <div className="receipt-label">Loan ID</div>
                    <div className="receipt-value">#{selectedRepayment.loanId}</div>
                  </div>
                  
                  <div className="receipt-row">
                    <div className="receipt-label">Payment Date</div>
                    <div className="receipt-value">{formatDate(selectedRepayment.repayDate)}</div>
                  </div>
                  
                  <div className="receipt-row highlight">
                    <div className="receipt-label">Amount Paid</div>
                    <div className="receipt-value">{formatCurrency(selectedRepayment.repayAmount)}</div>
                  </div>
                </div>
                
                <div className="receipt-watermark">PAID</div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setSelectedRepayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRepayPage;
