import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllSalaries, deleteSalary } from '../../apis/salaryApi';
import { getAllActiveEmployees } from '../../apis/employeeApi';
import type { Employee, Salary } from '../../models/types';
import { useNavigate } from 'react-router-dom';
import './SalaryList.css';

interface SalaryListProps {
  onEditSalary?: (salary: Salary) => void;
  onAddSalary?: () => void;
  isEmbedded?: boolean;
  limitEntries?: number;
  employeeFilter?: number;
}

const SalaryList: React.FC<SalaryListProps> = ({ 
  onEditSalary, 
  onAddSalary, 
  isEmbedded = false,
  limitEntries,
  employeeFilter
}) => {
  // Main data states
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [, setEmployees] = useState<Employee[]>([]);
  const [filteredSalaries, setFilteredSalaries] = useState<Salary[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<number, Employee>>({});

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [salaryToDelete, setSalaryToDelete] = useState<Salary | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [sortOrder, setSortOrder] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({ field: 'datePaid', direction: 'desc' });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Animation states
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Load salaries and employees on component mount or when filters change
  useEffect(() => {
    loadData();
  }, [employeeFilter]);

  // Load salary and employee data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data from API
      const [salaryData, employeeData] = await Promise.all([
        getAllSalaries(),
        getAllActiveEmployees()
      ]);

      setSalaries(salaryData);
      setEmployees(employeeData);

      // Create a map of employees for quick lookup
      const empMap = employeeData.reduce((acc, emp) => {
        acc[emp.id!] = emp;
        return acc;
      }, {} as Record<number, Employee>);
      
      setEmployeeMap(empMap);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load salary data');
      setIsLoading(false);
    }
  };

  // Apply filters to the salary data
  const applyFilters = useCallback(() => {
    let result = [...salaries];

    // Apply employee filter if provided as a prop
    if (employeeFilter !== undefined) {
      result = result.filter(salary => salary.employeeId === employeeFilter);
    }

    // Search term filter (search by employee name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(salary => {
        const employee = employeeMap[salary.employeeId];
        return employee && employee.name.toLowerCase().includes(term);
      });
    }

    // Payment type filter
    if (typeFilter) {
      result = result.filter(salary => salary.paymentType === typeFilter);
    }

    // Date range filter
    if (dateRangeFilter.start) {
      const startDate = new Date(dateRangeFilter.start);
      result = result.filter(salary => new Date(salary.datePaid) >= startDate);
    }
    if (dateRangeFilter.end) {
      const endDate = new Date(dateRangeFilter.end);
      endDate.setHours(23, 59, 59); // End of day
      result = result.filter(salary => new Date(salary.datePaid) <= endDate);
    }

    // Sort results
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOrder.field) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'datePaid':
          comparison = new Date(a.datePaid).getTime() - new Date(b.datePaid).getTime();
          break;
        case 'employeeName':
          const nameA = employeeMap[a.employeeId]?.name || '';
          const nameB = employeeMap[b.employeeId]?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'paymentType':
          comparison = a.paymentType.localeCompare(b.paymentType);
          break;
        default:
          comparison = new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime();
      }
      
      return sortOrder.direction === 'asc' ? comparison : -comparison;
    });

    // Limit entries if specified
    if (limitEntries) {
      result = result.slice(0, limitEntries);
    }

    setFilteredSalaries(result);
  }, [salaries, searchTerm, typeFilter, dateRangeFilter, sortOrder, employeeMap, employeeFilter, limitEntries]);

  // Update filtered data when filters or source data changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters, salaries, searchTerm, typeFilter, dateRangeFilter, sortOrder]);

  // Handle sort click
  const handleSort = (field: string) => {
    setSortOrder(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setDateRangeFilter({ start: '', end: '' });
    setSortOrder({ field: 'datePaid', direction: 'desc' });
    setShowFilters(false);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsReloading(true);
    await loadData();
    setIsReloading(false);
  };

  // Show delete confirmation modal
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

    try {
      await deleteSalary(salaryToDelete.id);
      
      // Update local state
      setSalaries(prev => prev.filter(s => s.id !== salaryToDelete.id));
      
      // Show success message
      setSuccessMessage('Salary payment deleted successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      setShowDeleteConfirm(false);
      setSalaryToDelete(null);
    } catch (err: any) {
      console.error('Error deleting salary:', err);
      setError(err.message || 'Failed to delete salary payment');
    }
  };

  // Handle edit salary
  const handleEdit = (salary: Salary) => {
    // Highlight the row that was clicked
    setHighlightedId(salary.id || null);
    setTimeout(() => setHighlightedId(null), 1000);

    if (onEditSalary) {
      onEditSalary(salary);
    } else {
      navigate(`/salaries/edit/${salary.id}`);
    }
  };

  // Handle add new salary
  const handleAddSalary = () => {
    if (onAddSalary) {
      onAddSalary();
    } else {
      navigate('/salaries/add');
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: number): string => {
    return employeeMap[employeeId]?.name || 'Unknown Employee';
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get payment type label
  const getPaymentTypeLabel = (type: string): string => {
    return type === 'salary' ? 'Monthly Salary' : 'Daily Credit';
  };

  // Get payment type icon
  const getPaymentTypeIcon = (type: string): string => {
    return type === 'salary' ? 'bi-wallet2' : 'bi-cash-coin';
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredSalaries.length / itemsPerPage);
  const paginatedSalaries = filteredSalaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setSelectedItem(null);
    setCurrentPage(page);
    
    // Scroll to top of the list when page changes
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end if we're near the beginning or end
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Item selection logic
  const toggleItemSelection = (id: number) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  return (
    <div 
      className={`salary-list-container ${isEmbedded ? 'embedded' : ''}`}
      ref={listRef}
    >
      {!isEmbedded && (
        <div className="list-header">
          <div className="header-left">
            <h2><i className="bi bi-cash-stack"></i> Salary Payments</h2>
            <p className="total-entries">
              {filteredSalaries.length} {filteredSalaries.length === 1 ? 'entry' : 'entries'} found
            </p>
          </div>
          
          <div className="header-actions">
            <button 
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
            >
              <i className="bi bi-grid"></i>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
            
            <div className="separator"></div>
            
            <button 
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="bi bi-funnel"></i>
              <span>Filter</span>
              {(searchTerm || typeFilter || dateRangeFilter.start || dateRangeFilter.end) && (
                <span className="filter-badge"></span>
              )}
            </button>
            
            <button 
              className={`refresh-btn ${isReloading ? 'rotating' : ''}`}
              onClick={handleRefresh}
              disabled={isLoading || isReloading}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            
            <button 
              className="add-btn pulse-effect"
              onClick={handleAddSalary}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Payment</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Filter Panel */}
      <div 
        className={`filter-panel ${showFilters ? 'open' : ''}`}
        ref={filterPanelRef}
      >
        <div className="filter-header">
          <h3><i className="bi bi-funnel"></i> Filter Payments</h3>
          <button 
            className="close-btn"
            onClick={() => setShowFilters(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="filter-body">
          <div className="filter-group">
            <label htmlFor="searchTerm">Search Employee</label>
            <div className="search-input-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name..."
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
          </div>
          
          <div className="filter-group">
            <label htmlFor="typeFilter">Payment Type</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="salary">Monthly Salary</option>
              <option value="daily_credit">Daily Credit</option>
            </select>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="startDate">From Date</label>
              <input
                type="date"
                id="startDate"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="endDate">To Date</label>
              <input
                type="date"
                id="endDate"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sortBy">Sort By</label>
            <div className="sort-selector">
              <select
                id="sortBy"
                value={sortOrder.field}
                onChange={(e) => setSortOrder(prev => ({ ...prev, field: e.target.value }))}
              >
                <option value="datePaid">Payment Date</option>
                <option value="amount">Amount</option>
                <option value="employeeName">Employee Name</option>
                <option value="paymentType">Payment Type</option>
              </select>
              <button
                className="sort-direction"
                onClick={() => setSortOrder(prev => ({ 
                  ...prev, 
                  direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                }))}
              >
                <i className={`bi bi-sort-${sortOrder.direction === 'asc' ? 'up' : 'down'}`}></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="filter-footer">
          <button 
            className="reset-btn"
            onClick={resetFilters}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset Filters
          </button>
          <button 
            className="apply-btn"
            onClick={() => setShowFilters(false)}
          >
            <i className="bi bi-check-lg"></i>
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Applied Filters */}
      {(searchTerm || typeFilter || dateRangeFilter.start || dateRangeFilter.end) && (
        <div className="applied-filters">
          <div className="filter-chips">
            {searchTerm && (
              <div className="filter-chip">
                <i className="bi bi-search"></i>
                <span>{searchTerm}</span>
                <button onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {typeFilter && (
              <div className="filter-chip">
                <i className={`bi ${getPaymentTypeIcon(typeFilter)}`}></i>
                <span>{getPaymentTypeLabel(typeFilter)}</span>
                <button onClick={() => setTypeFilter('')}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {dateRangeFilter.start && (
              <div className="filter-chip">
                <i className="bi bi-calendar-event"></i>
                <span>From {formatDate(dateRangeFilter.start)}</span>
                <button onClick={() => setDateRangeFilter(prev => ({ ...prev, start: '' }))}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {dateRangeFilter.end && (
              <div className="filter-chip">
                <i className="bi bi-calendar-event"></i>
                <span>To {formatDate(dateRangeFilter.end)}</span>
                <button onClick={() => setDateRangeFilter(prev => ({ ...prev, end: '' }))}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>
          
          <button 
            className="clear-all-btn"
            onClick={resetFilters}
          >
            <i className="bi bi-x-circle"></i>
            Clear All
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="shimmer-container">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="shimmer-card">
                <div className="shimmer-header">
                  <div className="shimmer-avatar"></div>
                  <div className="shimmer-title"></div>
                </div>
                <div className="shimmer-body">
                  <div className="shimmer-line"></div>
                  <div className="shimmer-line"></div>
                  <div className="shimmer-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="error-state">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={handleRefresh}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Try Again
          </button>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && filteredSalaries.length === 0 && (
        <div className="empty-state">
          <div className="empty-illustration">
            <i className="bi bi-cash-stack"></i>
          </div>
          <h3>No Salary Payments Found</h3>
          <p>
            {(searchTerm || typeFilter || dateRangeFilter.start || dateRangeFilter.end) 
              ? 'No payments match your current filters. Try adjusting your search criteria.'
              : 'No salary payments have been recorded yet. Click the button below to add your first payment.'}
          </p>
          
          {(searchTerm || typeFilter || dateRangeFilter.start || dateRangeFilter.end) ? (
            <button 
              className="action-btn"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Reset Filters
            </button>
          ) : (
            <button 
              className="action-btn"
              onClick={handleAddSalary}
            >
              <i className="bi bi-plus-circle"></i>
              Add First Payment
            </button>
          )}
        </div>
      )}
      
      {/* Card View */}
      {!isLoading && !error && filteredSalaries.length > 0 && viewMode === 'cards' && (
        <div className="salary-card-grid">
          {paginatedSalaries.map((salary) => (
            <div 
              key={salary.id} 
              className={`salary-card ${highlightedId === salary.id ? 'highlight' : ''} ${selectedItem === salary.id ? 'selected' : ''}`}
              onClick={() => toggleItemSelection(salary.id!)}
            >
              <div className="card-header">
                <div className="employee-info">
                  <div className="employee-avatar">
                    <span>{getEmployeeName(salary.employeeId).split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                  </div>
                  <div className="employee-details">
                    <h3 className="employee-name">{getEmployeeName(salary.employeeId)}</h3>
                    <span className="payment-date">{formatDate(salary.datePaid)}</span>
                  </div>
                </div>
                <div className={`payment-type-badge ${salary.paymentType}`}>
                  <i className={`bi ${getPaymentTypeIcon(salary.paymentType)}`}></i>
                  <span>{getPaymentTypeLabel(salary.paymentType)}</span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="payment-amount">
                  <span className="amount-label">Amount Paid</span>
                  <span className="amount-value">{formatCurrency(salary.amount)}</span>
                </div>
                
                {salary.lastSalaryDate && (
                  <div className="last-salary-date">
                    <span>Last salary date: {formatDate(salary.lastSalaryDate)}</span>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(salary);
                  }}
                >
                  <i className="bi bi-eye"></i>
                  <span>View</span>
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(salary);
                  }}
                >
                  <i className="bi bi-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
              
              {salary.paymentType === 'salary' && (
                <div className="card-corner-badge">
                  <i className="bi bi-calendar-month"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Table View */}
      {!isLoading && !error && filteredSalaries.length > 0 && viewMode === 'table' && (
        <div className="salary-table-wrapper">
          <table className="salary-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <div className="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      id="select-all" 
                      checked={false} 
                      onChange={() => {/* Handle select all */}}
                    />
                    <label htmlFor="select-all"></label>
                  </div>
                </th>
                <th 
                  className={`sortable ${sortOrder.field === 'employeeName' ? 'active' : ''}`}
                  onClick={() => handleSort('employeeName')}
                >
                  <div className="th-content">
                    <span>Employee</span>
                    {sortOrder.field === 'employeeName' && (
                      <i className={`bi bi-caret-${sortOrder.direction === 'asc' ? 'up' : 'down'}-fill`}></i>
                    )}
                  </div>
                </th>
                <th 
                  className={`sortable ${sortOrder.field === 'datePaid' ? 'active' : ''}`}
                  onClick={() => handleSort('datePaid')}
                >
                  <div className="th-content">
                    <span>Date Paid</span>
                    {sortOrder.field === 'datePaid' && (
                      <i className={`bi bi-caret-${sortOrder.direction === 'asc' ? 'up' : 'down'}-fill`}></i>
                    )}
                  </div>
                </th>
                <th 
                  className={`sortable ${sortOrder.field === 'paymentType' ? 'active' : ''}`}
                  onClick={() => handleSort('paymentType')}
                >
                  <div className="th-content">
                    <span>Type</span>
                    {sortOrder.field === 'paymentType' && (
                      <i className={`bi bi-caret-${sortOrder.direction === 'asc' ? 'up' : 'down'}-fill`}></i>
                    )}
                  </div>
                </th>
                <th 
                  className={`amount-col sortable ${sortOrder.field === 'amount' ? 'active' : ''}`}
                  onClick={() => handleSort('amount')}
                >
                  <div className="th-content">
                    <span>Amount</span>
                    {sortOrder.field === 'amount' && (
                      <i className={`bi bi-caret-${sortOrder.direction === 'asc' ? 'up' : 'down'}-fill`}></i>
                    )}
                  </div>
                </th>
                <th className="last-date-col">Last Salary Date</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSalaries.map((salary) => (
                <tr 
                  key={salary.id} 
                  className={`
                    ${highlightedId === salary.id ? 'highlight' : ''}
                    ${selectedItem === salary.id ? 'selected' : ''}
                  `}
                  onClick={() => toggleItemSelection(salary.id!)}
                >
                  <td className="checkbox-col">
                    <div className="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        id={`select-${salary.id}`} 
                        checked={selectedItem === salary.id}
                        onChange={() => toggleItemSelection(salary.id!)}
                      />
                      <label htmlFor={`select-${salary.id}`}></label>
                    </div>
                  </td>
                  <td className="employee-col">
                    <div className="employee-cell">
                      <div className="avatar">
                        {getEmployeeName(salary.employeeId).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="employee-name">{getEmployeeName(salary.employeeId)}</span>
                    </div>
                  </td>
                  <td className="date-col">
                    <div className="date-cell">
                      <span className="date">{formatDate(salary.datePaid)}</span>
                    </div>
                  </td>
                  <td className="type-col">
                    <div className={`payment-type ${salary.paymentType}`}>
                      <i className={`bi ${getPaymentTypeIcon(salary.paymentType)}`}></i>
                      <span>{getPaymentTypeLabel(salary.paymentType)}</span>
                    </div>
                  </td>
                  <td className="amount-col">
                    <div className="amount-cell">
                      <span className="amount">{formatCurrency(salary.amount)}</span>
                    </div>
                  </td>
                  <td className="last-date-col">
                    <div className="last-date-cell">
                      <span>{salary.lastSalaryDate ? formatDate(salary.lastSalaryDate) : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(salary);
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(salary);
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && !error && filteredSalaries.length > 0 && !isEmbedded && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span>{Math.min(currentPage * itemsPerPage, filteredSalaries.length)}</span> of{' '}
            <span>{filteredSalaries.length}</span> entries
          </div>
          
          <div className="pagination-controls">
            <button 
              className="page-btn prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            
            {getPageNumbers().map((pageNum, index) => (
              pageNum < 0 ? (
                // Render ellipsis
                <span key={`ellipsis-${index}`} className="ellipsis">...</span>
              ) : (
                <button 
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            ))}
            
            <button 
              className="page-btn next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          
          <div className="pagination-size">
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Floating Action Button (for mobile) */}
      {!isEmbedded && (
        <button className="floating-action-btn" onClick={handleAddSalary}>
          <i className="bi bi-plus-lg"></i>
        </button>
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
                  <div className="detail-row">
                    <span className="detail-label">Payment Type:</span>
                    <span className="detail-value">{getPaymentTypeLabel(salaryToDelete.paymentType)}</span>
                  </div>
                </div>
              )}
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={cancelDelete}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleDelete}
              >
                <i className="bi bi-trash"></i>
                Delete
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
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default SalaryList;
