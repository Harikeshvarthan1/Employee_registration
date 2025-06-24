import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllLoans, getActiveLoans, registerLoan, updateLoanStatus, deleteLoan } from '../../apis/loanRegistrationApi';
import { getRepaymentsByLoanId } from '../../apis/loanRepayApi';
import { getAllActiveEmployees } from '../../apis/employeeApi';
import type{ LoanRegistration, LoanRepay, Employee } from '../../models/types';

import './LoanRegisterPage.css';

const LoanRegisterPage: React.FC = () => {
  // Navigation and auth
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  // State management for loans
  const [loans, setLoans] = useState<LoanRegistration[]>([]);
  const [, setActiveLoans] = useState<LoanRegistration[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanRegistration[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanRegistration | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'detail'>('list');
  const [filterActive, setFilterActive] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form states for new loan
  const [loanForm, setLoanForm] = useState({
    employeeId: 0,
    loanAmount: 0,
    reason: '',
    loanDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  // Repayment tracking
  const [loanRepayments, setLoanRepayments] = useState<LoanRepay[]>([]);
  const [showRepaymentHistory, setShowRepaymentHistory] = useState<boolean>(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [loanToDelete, setLoanToDelete] = useState<LoanRegistration | null>(null);
  const [loanToUpdateStatus, setLoanToUpdateStatus] = useState<LoanRegistration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Analytics and stats
  const [stats, setStats] = useState({
    totalLoansAmount: 0,
    activeLoansAmount: 0,
    averageLoanAmount: 0,
    totalLoans: 0,
    activeLoansCount: 0,
    recentActivity: [] as {date: Date, action: string, amount: number, employee: string}[]
  });

  // Refs
  const formRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate('/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [allLoans, activeLns, emps] = await Promise.all([
          getAllLoans(),
          getActiveLoans(),
          getAllActiveEmployees()
        ]);

        setLoans(allLoans);
        setActiveLoans(activeLns);
        
        // Apply initial filters
        applyFiltersAndSort(allLoans, filterActive, searchTerm, selectedEmployee, sortOrder, emps);
        
        setEmployees(emps);

        // Calculate statistics
        calculateStats(allLoans, activeLns);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading loan data:', err);
        setError(err.message || 'Failed to load loan data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // Function to apply filters and sorting
  const applyFiltersAndSort = (
    loansData: LoanRegistration[], 
    isActiveFilter: boolean, 
    search: string, 
    empFilter: number | null, 
    sort: 'newest' | 'oldest' | 'amount',
    employeesData: Employee[]
  ) => {
    let filtered = [...loansData];

    // Filter by active status if needed
    if (isActiveFilter) {
      filtered = filtered.filter(loan => loan.status === 'active');
    }

    // Filter by search term
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(loan => {
        const employee = employeesData.find(emp => emp.id === loan.employeeId);
        return (
          employee?.name.toLowerCase().includes(term) ||
          loan.reason.toLowerCase().includes(term) ||
          loan.loanAmount.toString().includes(term)
        );
      });
    }

    // Filter by selected employee
    if (empFilter) {
      filtered = filtered.filter(loan => loan.employeeId === empFilter);
    }

    // Sort the filtered results
    switch (sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime());
        break;
      case 'amount':
        filtered.sort((a, b) => b.loanAmount - a.loanAmount);
        break;
    }

    setFilteredLoans(filtered);
  };

  // Handle filter changes
  useEffect(() => {
    applyFiltersAndSort(loans, filterActive, searchTerm, selectedEmployee, sortOrder, employees);
  }, [loans, filterActive, searchTerm, selectedEmployee, sortOrder, employees]);

  // Calculate loan statistics
  const calculateStats = (allLoans: LoanRegistration[], activeLoans: LoanRegistration[]) => {
    const totalAmount = allLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const activeAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const avgAmount = allLoans.length > 0 ? totalAmount / allLoans.length : 0;

    // Recent activity
    const sortedLoans = [...allLoans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());

    const recentActivity = sortedLoans.slice(0, 5).map(loan => {
      const employee = employees.find(emp => emp.id === loan.employeeId);

      return {
        date: new Date(loan.loanDate),
        action: 'Loan Registered',
        amount: loan.loanAmount,
        employee: employee?.name || 'Unknown Employee'
      };
    });

    setStats({
      totalLoansAmount: totalAmount,
      activeLoansAmount: activeAmount,
      averageLoanAmount: avgAmount,
      totalLoans: allLoans.length,
      activeLoansCount: activeLoans.length,
      recentActivity
    });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setLoanForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // Set Active Only filter
  const handleActiveFilterToggle = (isActive: boolean) => {
    setFilterActive(isActive);
    
    // Display a temporary success message
    if (isActive) {
      setSuccessMessage('Showing active loans only');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  // Set sort order
  const handleSortOrderChange = (order: 'newest' | 'oldest' | 'amount') => {
    setSortOrder(order);
    
    // Display a temporary success message
    if (order === 'newest') {
      setSuccessMessage('Sorted by newest loans first');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  // Switch to the loan registration form
  const handleRegisterLoan = () => {
    // Reset form
    setLoanForm({
      employeeId: 0,
      loanAmount: 0,
      reason: '',
      loanDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    setViewMode('form');

    // Scroll to form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Submit the loan registration form - UPDATED
  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loanForm.employeeId === 0) {
      setError('Please select an employee');
      return;
    }

    if (loanForm.loanAmount <= 0) {
      setError('Loan amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a properly formatted payload that matches the backend expectations
      const loanPayload = {
        employeeId: Number(loanForm.employeeId), // Ensure it's a number
        loanAmount: loanForm.loanAmount,
        reason: loanForm.reason,
        loanDate: loanForm.loanDate,
        status: loanForm.status
      };

      console.log('Sending loan registration data:', loanPayload); // Debug log
      const newLoan = await registerLoan(loanPayload);
      console.log('Response from server:', newLoan); // Debug log

      // Show success message
      setSuccessMessage('Loan registered successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form and return to list view
      setLoanForm({
        employeeId: 0,
        loanAmount: 0,
        reason: '',
        loanDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });

      setViewMode('list');
      
      // Refresh data to update lists and stats
      setRefreshTrigger(prev => prev + 1);

    } catch (err: any) {
      console.error('Error registering loan:', err);
      setError(err.message || 'Failed to register loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View loan details
  const handleViewLoanDetails = async (loan: LoanRegistration) => {
    setSelectedLoan(loan);
    setViewMode('detail');

    try {
      const repayments = await getRepaymentsByLoanId(loan.loanId ?? 0);
      setLoanRepayments(repayments);
    } catch (err) {
      console.error('Error loading repayments:', err);
      setLoanRepayments([]);
    }

    // Scroll to details
    setTimeout(() => {
      if (detailRef.current) {
        detailRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  // Confirm loan deletion
  const confirmDelete = (loan: LoanRegistration) => {
    setLoanToDelete(loan);
    setShowDeleteModal(true);
  };

  // Handle loan deletion - UPDATED
  const handleDeleteLoan = async () => {
    if (!loanToDelete || !loanToDelete.loanId) return;

    setIsSubmitting(true);

    try {
      console.log(`Deleting loan with ID: ${loanToDelete.loanId}`); // Debug log
      await deleteLoan(loanToDelete.loanId);
      console.log('Loan deleted successfully'); // Debug log

      // Show success message
      setSuccessMessage('Loan deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Close modal and reset state
      setShowDeleteModal(false);
      setLoanToDelete(null);

      // If we were viewing this loan's details, go back to list
      if (selectedLoan?.loanId === loanToDelete.loanId) {
        setViewMode('list');
        setSelectedLoan(null);
      }

      // Refresh data to update lists and stats
      setRefreshTrigger(prev => prev + 1);

    } catch (err: any) {
      console.error('Error deleting loan:', err);
      setError(err.message || 'Failed to delete loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm loan status update
  const confirmStatusUpdate = (loan: LoanRegistration) => {
    setLoanToUpdateStatus(loan);
    setShowStatusModal(true);
  };

  // Handle loan status update - UPDATED
  const handleUpdateStatus = async () => {
    if (!loanToUpdateStatus || !loanToUpdateStatus.loanId) return;

    const newStatus = loanToUpdateStatus.status === 'active' ? 'inactive' : 'active';
    setIsSubmitting(true);

    try {
      console.log(`Updating loan ${loanToUpdateStatus.loanId} status to: ${newStatus}`); // Debug log
      
      // Note: We're sending the status as a string to match the API controller expectation
      const updatedLoan = await updateLoanStatus(loanToUpdateStatus.loanId, newStatus);
      console.log('Response from server:', updatedLoan); // Debug log

      // Show success message
      setSuccessMessage(`Loan marked as ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Close modal and reset state
      setShowStatusModal(false);
      setLoanToUpdateStatus(null);

      // Update selected loan if it was the one updated
      if (selectedLoan?.loanId === updatedLoan.loanId) {
        setSelectedLoan(updatedLoan);
      }

      // Refresh data to update lists and stats
      setRefreshTrigger(prev => prev + 1);

    } catch (err: any) {
      console.error('Error updating loan status:', err);
      setError(err.message || 'Failed to update loan status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate repayment progress
  const calculateRepaymentProgress = (loan: LoanRegistration) => {
    if (!loan) return 0;

    // Calculate total repaid amount
    const totalRepaid = loanRepayments.reduce(
      (sum, repayment) => sum + repayment.repayAmount, 0
    );

    // Calculate percentage
    return Math.min(Math.round((totalRepaid / loan.loanAmount) * 100), 100);
  };

  // Get total repaid amount
  const getTotalRepaidAmount = () => {
    return loanRepayments.reduce((sum, repayment) => sum + repayment.repayAmount, 0);
  };

  // Get remaining amount to be repaid
  const getRemainingAmount = () => {
    if (!selectedLoan) return 0;
    const totalRepaid = getTotalRepaidAmount();
    return Math.max(selectedLoan.loanAmount - totalRepaid, 0);
  };

  return (
    <div className="loan-register-page">
      <main className="loan-register-content">
        {/* Page header with title and action buttons */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Loan Registration</h1>
            <p className="page-description">
              Manage employee loans, track repayments, and monitor loan statuses
            </p>
          </div>

          {viewMode === 'list' && (
            <div className="header-actions">
              <button 
                className="register-loan-button"
                onClick={handleRegisterLoan}
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>Register New Loan</span>
              </button>
            </div>
          )}
          
          {viewMode !== 'list' && (
            <div className="header-actions">
              <button 
                className="back-button"
                onClick={() => {
                  setViewMode('list');
                  setSelectedLoan(null);
                  setLoanRepayments([]);
                  setShowRepaymentHistory(false);
                }}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back to Loans</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <div className="error-container">
            <div className="error-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="error-content">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
            <button 
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
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

        {/* Loan register form view */}
        {viewMode === 'form' && (
          <div className="loan-form-section" ref={formRef}>
            <div className="loan-form-card">
              <div className="card-header">
                <h2>
                  <i className="bi bi-file-earmark-plus"></i>
                  Register New Loan
                </h2>
              </div>
              
              <div className="card-body">
                <form onSubmit={handleSubmitLoan}>
                  <div className="form-grid">
                    {/* Employee selection */}
                    <div className="form-group">
                      <label htmlFor="employeeId">
                        <i className="bi bi-person"></i>
                        Employee <span className="required">*</span>
                      </label>
                      <select
                        id="employeeId"
                        name="employeeId"
                        className="form-control"
                        value={loanForm.employeeId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} - {employee.role}
                          </option>
                        ))}
                      </select>
                      <div className="help-text">
                        Only active employees are eligible for loans
                      </div>
                    </div>
                    
                    {/* Loan amount */}
                    <div className="form-group">
                      <label htmlFor="loanAmount">
                        <i className="bi bi-cash"></i>
                        Loan Amount <span className="required">*</span>
                      </label>
                      <div className="currency-input">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          id="loanAmount"
                          name="loanAmount"
                          className="form-control"
                          min="1"
                          step="0.01"
                          value={loanForm.loanAmount}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {loanForm.loanAmount > 0 && (
                        <div className="amount-preview">
                          {formatCurrency(loanForm.loanAmount)}
                        </div>
                      )}
                    </div>
                    
                    {/* Loan date */}
                    <div className="form-group">
                      <label htmlFor="loanDate">
                        <i className="bi bi-calendar-event"></i>
                        Loan Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="loanDate"
                        name="loanDate"
                        className="form-control"
                        value={loanForm.loanDate}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    {/* Status selection */}
                    <div className="form-group">
                      <label htmlFor="status">
                        <i className="bi bi-toggle-on"></i>
                        Status <span className="required">*</span>
                      </label>
                      <div className="status-toggle">
                        <input
                          type="checkbox"
                          id="status-toggle"
                          checked={loanForm.status === 'active'}
                          onChange={(e) => {
                            setLoanForm(prev => ({
                              ...prev,
                              status: e.target.checked ? 'active' : 'inactive'
                            }));
                          }}
                          className="toggle-checkbox"
                        />
                        <label htmlFor="status-toggle" className="toggle-switch"></label>
                        <span className={`toggle-label ${loanForm.status === 'active' ? 'active' : 'inactive'}`}>
                          {loanForm.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Reason textarea */}
                    <div className="form-group full-width">
                      <label htmlFor="reason">
                        <i className="bi bi-chat-left-text"></i>
                        Loan Reason <span className="required">*</span>
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        className="form-control"
                        value={loanForm.reason}
                        onChange={handleInputChange}
                        placeholder="Enter the purpose of this loan"
                        rows={4}
                        required
                      ></textarea>
                    </div>
                  </div>
                  
                  {/* Form actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setViewMode('list');
                        setError(null);
                      }}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-x-circle"></i>
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner">
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                          </div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle"></i>
                          Register Loan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Loan details view */}
        {viewMode === 'detail' && selectedLoan && (
          <div className="loan-detail-section" ref={detailRef}>
            <div className="loan-detail-card">
              <div className="card-header">
                <h2>
                  <i className="bi bi-file-earmark-text"></i>
                  Loan Details
                </h2>
                <div className="loan-id">Loan ID: {selectedLoan.loanId}</div>
              </div>
              
              <div className="card-body">
                <div className="loan-details-grid">
                  <div className="loan-info-section">
                    <div className="loan-detail-row">
                      <div className="detail-label">
                        <i className="bi bi-person"></i>
                        Employee
                      </div>
                      <div className="detail-value">
                        {employees.find(emp => emp.id === selectedLoan.employeeId)?.name || 'Unknown'}
                      </div>
                    </div>
                    
                    <div className="loan-detail-row">
                      <div className="detail-label">
                        <i className="bi bi-cash"></i>
                        Loan Amount
                      </div>
                      <div className="detail-value primary">
                        {formatCurrency(selectedLoan.loanAmount)}
                      </div>
                    </div>
                    
                    <div className="loan-detail-row">
                      <div className="detail-label">
                        <i className="bi bi-calendar-event"></i>
                        Loan Date
                      </div>
                      <div className="detail-value">
                        {formatDate(selectedLoan.loanDate)}
                      </div>
                    </div>
                    
                    <div className="loan-detail-row">
                      <div className="detail-label">
                        <i className="bi bi-toggle-on"></i>
                        Status
                      </div>
                      <div className={`status-badge ${selectedLoan.status}`}>
                        {selectedLoan.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="loan-detail-row">
                      <div className="detail-label">
                        <i className="bi bi-chat-left-text"></i>
                        Reason
                      </div>
                      <div className="detail-value reason-text">
                        {selectedLoan.reason}
                      </div>
                    </div>
                  </div>
                  
                  <div className="loan-repayment-section">
                    <h3>Repayment Overview</h3>
                    
                    <div className="repayment-progress-container">
                      <div className="progress-label">
                        <span>Repayment Progress</span>
                        <span className="progress-percentage">
                          {calculateRepaymentProgress(selectedLoan)}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar"
                          style={{ width: `${calculateRepaymentProgress(selectedLoan)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="repayment-amounts">
                      <div className="amount-item">
                        <div className="amount-label">Total Loan</div>
                        <div className="amount-value">
                          {formatCurrency(selectedLoan.loanAmount)}
                        </div>
                      </div>
                      
                      <div className="amount-item">
                        <div className="amount-label">Total Repaid</div>
                        <div className="amount-value success">
                          {formatCurrency(getTotalRepaidAmount())}
                        </div>
                      </div>
                      
                      <div className="amount-item">
                        <div className="amount-label">Remaining</div>
                        <div className="amount-value warning">
                          {formatCurrency(getRemainingAmount())}
                        </div>
                      </div>
                    </div>
                    
                    <div className="repayment-actions">
                      <button 
                        className="btn btn-outline"
                        onClick={() => setShowRepaymentHistory(!showRepaymentHistory)}
                      >
                        <i className={`bi ${showRepaymentHistory ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        {showRepaymentHistory ? 'Hide Repayment History' : 'Show Repayment History'}
                      </button>
                    </div>
                    
                    {showRepaymentHistory && (
                      <div className="repayment-history">
                        <h4>Repayment History</h4>
                        
                        {loanRepayments.length === 0 ? (
                          <div className="no-repayments">
                            <i className="bi bi-exclamation-circle"></i>
                            <p>No repayments have been made for this loan yet.</p>
                          </div>
                        ) : (
                          <div className="repayment-list">
                            {loanRepayments.map((repayment, index) => (
                              <div key={repayment.id || index} className="repayment-item">
                                <div className="repayment-icon">
                                  <i className="bi bi-arrow-return-right"></i>
                                </div>
                                <div className="repayment-info">
                                  <div className="repayment-date">
                                    {formatDate(repayment.repayDate)}
                                  </div>
                                  <div className="repayment-amount">
                                    {formatCurrency(repayment.repayAmount)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="loan-detail-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => confirmStatusUpdate(selectedLoan)}
                  >
                    <i className={`bi ${selectedLoan.status === 'active' ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                    {selectedLoan.status === 'active' ? 'Mark as Inactive' : 'Mark as Active'}
                  </button>
                  
                  <button 
                    className="btn btn-danger"
                    onClick={() => confirmDelete(selectedLoan)}
                  >
                    <i className="bi bi-trash"></i>
                    Delete Loan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans list view */}
        {viewMode === 'list' && (
          <>
            {/* Dashboard Stats */}
            <div className="loan-dashboard">
              <div className="stats-grid">
                <div className="stat-card total-loans">
                  <div className="stat-icon">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalLoans}</div>
                    <div className="stat-label">Total Loans</div>
                  </div>
                  <div className="stat-footer">
                    <div className="stat-change positive">
                      <i className="bi bi-check-circle-fill"></i>
                      {stats.activeLoansCount} Active
                    </div>
                  </div>
                </div>
                
                <div className="stat-card active-amount">
                  <div className="stat-icon">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{formatCurrency(stats.activeLoansAmount)}</div>
                    <div className="stat-label">Active Loans Amount</div>
                  </div>
                  <div className="stat-footer">
                    <div className="stat-change info">
                      <i className="bi bi-graph-up"></i>
                      {formatCurrency(stats.totalLoansAmount)} Total
                    </div>
                  </div>
                </div>
                
                <div className="stat-card average-loan">
                  <div className="stat-icon">
                    <i className="bi bi-calculator"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{formatCurrency(stats.averageLoanAmount)}</div>
                    <div className="stat-label">Average Loan Amount</div>
                  </div>
                  <div className="stat-footer">
                    <div className="stat-change neutral">
                      <i className="bi bi-info-circle-fill"></i>
                      Based on {stats.totalLoans} loans
                    </div>
                  </div>
                </div>
                
                <div className="stat-card recent-activity">
                  <div className="activity-header">
                    <h3>Recent Activity</h3>
                  </div>
                  <div className="activity-list">
                    {stats.recentActivity.length === 0 ? (
                      <div className="no-activity">
                        <i className="bi bi-clock-history"></i>
                        <p>No recent loan activity</p>
                      </div>
                    ) : (
                      stats.recentActivity.slice(0, 4).map((activity, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-icon">
                            <i className="bi bi-file-earmark-plus"></i>
                          </div>
                          <div className="activity-details">
                            <div className="activity-title">
                              {activity.employee} - {formatCurrency(activity.amount)}
                            </div>
                            <div className="activity-meta">
                              <span className="activity-date">{formatDate(activity.date)}</span>
                              <span className="activity-type">{activity.action}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Loans list with filters */}
            <div className="loans-list-section">
              <div className="filters-bar">
                <div className="search-field">
                  <div className="search-icon">
                    <i className="bi bi-search"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by employee, reason, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                
                <div className="filter-options">
                  <div className="filter-group">
                    <label htmlFor="employeeFilter">Employee:</label>
                    <select
                      id="employeeFilter"
                      value={selectedEmployee || ''}
                      onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">All Employees</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="statusFilter">Status:</label>
                    <div className="toggle-filter">
                      <button
                        className={`filter-btn ${!filterActive ? 'active' : ''}`}
                        onClick={() => handleActiveFilterToggle(false)}
                      >
                        All
                      </button>
                      <button
                        className={`filter-btn ${filterActive ? 'active' : ''}`}
                        onClick={() => handleActiveFilterToggle(true)}
                      >
                        Active Only
                      </button>
                    </div>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="sortOrder">Sort By:</label>
                    <select
                      id="sortOrder"
                      value={sortOrder}
                      onChange={(e) => handleSortOrderChange(e.target.value as 'newest' | 'oldest' | 'amount')}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="amount">Amount (High to Low)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Loading state */}
              {isLoading && (
                <div className="loading-container">
                  <div className="loading-spinner">
                    <div className="spinner-circle"></div>
                    <div className="spinner-circle inner"></div>
                  </div>
                  <p>Loading loan data...</p>
                </div>
              )}
              
              {/* Empty state */}
              {!isLoading && filteredLoans.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="bi bi-file-earmark-x"></i>
                  </div>
                  <h3>No Loans Found</h3>
                  <p>
                    {searchTerm || selectedEmployee || filterActive ? 
                      'No loans match your current filters.' : 
                      'There are no loans registered in the system.'}
                  </p>
                  {(searchTerm || selectedEmployee || filterActive) && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedEmployee(null);
                        setFilterActive(false);
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
              
              {/* Filter Indicator */}
              {!isLoading && filteredLoans.length > 0 && (
                <div className="filter-indicator">
                  <span className="results-count">
                    Showing <strong>{filteredLoans.length}</strong> loan{filteredLoans.length !== 1 ? 's' : ''}
                  </span>
                  {filterActive && (
                    <span className="active-filter-badge">
                      <i className="bi bi-filter-circle-fill"></i> Active Only
                    </span>
                  )}
                  {sortOrder === 'newest' && (
                    <span className="sort-badge">
                      <i className="bi bi-sort-down"></i> Newest First
                    </span>
                  )}
                </div>
              )}
              
              {/* Loans grid */}
              {!isLoading && filteredLoans.length > 0 && (
                <div className="loans-grid">
                  {filteredLoans.map(loan => {
                    const employee = employees.find(emp => emp.id === loan.employeeId);
                    return (
                      <div key={loan.loanId} className={`loan-card ${loan.status}`}>
                        <div className="loan-header">
                          <div className="loan-employee">
                            <div className="employee-avatar">
                              {employee?.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                            </div>
                            <div className="employee-info">
                              <div className="employee-name">{employee?.name || 'Unknown Employee'}</div>
                              <div className="employee-role">{employee?.role || 'Unknown Role'}</div>
                            </div>
                          </div>
                          <div className={`loan-status-badge ${loan.status}`}>
                            {loan.status === 'active' ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        
                        <div className="loan-body">
                          <div className="loan-amount">
                            <div className="amount-label">Loan Amount</div>
                            <div className="amount-value">{formatCurrency(loan.loanAmount)}</div>
                          </div>
                          
                          <div className="loan-date">
                            <i className="bi bi-calendar-event"></i>
                            <span>{formatDate(loan.loanDate)}</span>
                          </div>
                          
                          <div className="loan-reason">
                            <div className="reason-label">Purpose:</div>
                            <div className="reason-text">
                              {loan.reason.length > 100 ? 
                                `${loan.reason.substring(0, 100)}...` : 
                                loan.reason}
                            </div>
                          </div>
                        </div>
                        
                        <div className="loan-footer">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleViewLoanDetails(loan)}
                          >
                            <i className="bi bi-eye"></i>
                            View Details
                          </button>
                          
                          <div className="quick-actions">
                            <button 
                              className="action-btn status-toggle"
                              onClick={() => confirmStatusUpdate(loan)}
                              title={loan.status === 'active' ? 'Mark as Inactive' : 'Mark as Active'}
                            >
                              <i className={`bi ${loan.status === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            </button>
                            
                            <button 
                              className="action-btn delete"
                              onClick={() => confirmDelete(loan)}
                              title="Delete Loan"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Confirm Delete</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setLoanToDelete(null);
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete this loan for 
                <strong> {employees.find(emp => emp.id === loanToDelete?.employeeId)?.name || 'Unknown'}</strong>?
              </p>
              <p className="warning-text">
                <i className="bi bi-exclamation-circle"></i>
                This action cannot be undone. All repayment records associated with this loan will also be deleted.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setLoanToDelete(null);
                }}
              >
                Cancel
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={handleDeleteLoan}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner">
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                    </div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash"></i>
                    Delete Loan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status update confirmation modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                <i className={`bi ${loanToUpdateStatus?.status === 'active' ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                Confirm Status Change
              </h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowStatusModal(false);
                  setLoanToUpdateStatus(null);
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to mark this loan as 
                <strong> {loanToUpdateStatus?.status === 'active' ? 'inactive' : 'active'}</strong>?
              </p>
              
              {loanToUpdateStatus?.status === 'active' ? (
                <div className="status-info inactive-info">
                  <i className="bi bi-info-circle"></i>
                  <p>
                    An inactive loan will no longer be displayed in active loans reports.
                    This is typically done when a loan is fully repaid or cancelled.
                  </p>
                </div>
              ) : (
                <div className="status-info active-info">
                  <i className="bi bi-info-circle"></i>
                  <p>
                    An active loan will be included in all active loans reports and calculations.
                    This should only be used for loans that are currently being repaid.
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowStatusModal(false);
                  setLoanToUpdateStatus(null);
                }}
              >
                Cancel
              </button>
              
              <button 
                className={`btn ${loanToUpdateStatus?.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                onClick={handleUpdateStatus}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner">
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                    </div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${loanToUpdateStatus?.status === 'active' ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                    Mark as {loanToUpdateStatus?.status === 'active' ? 'Inactive' : 'Active'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRegisterPage;