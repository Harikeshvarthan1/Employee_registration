import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LoanRepay, LoanRegistration, Employee } from "../../models/types";
import {
  getAllRepayments,
  getRepaymentsByEmployeeId,
  getRepaymentsByLoanId,
  deleteRepayment,
} from "../../apis/loanRepayApi";
import { getLoanById } from "../../apis/loanRegistrationApi";
import { getAllActiveEmployees } from "../../apis/employeeApi";
import "./LoanRepayList.css";

interface LoanRepayListProps {
  onAddRepayment?: () => void;
  onViewDetails?: (repayment: LoanRepay) => void;
  employeeId?: number; // Optional: to show only repayments for a specific employee
  loanId?: number; // Optional: to show only repayments for a specific loan
}

const LoanRepayList: React.FC<LoanRepayListProps> = ({
  onAddRepayment,
  onViewDetails,
  employeeId,
  loanId,
}) => {
  // Data states
  const [repayments, setRepayments] = useState<LoanRepay[]>([]);
  const [filteredRepayments, setFilteredRepayments] = useState<LoanRepay[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<LoanRegistration[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepay | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">(
    "list"
  );
  const [expandedRepaymentId, setExpandedRepaymentId] = useState<number | null>(
    null
  );
  const [selectedRepayment, setSelectedRepayment] = useState<LoanRepay | null>(
    null
  );
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | "">("");
  const [filterLoanId, setFilterLoanId] = useState<number | "">("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Summary metrics
  const [totalRepayments, setTotalRepayments] = useState<number>(0);
  const [monthlyTrend, setMonthlyTrend] = useState<
    { month: string; amount: number }[]
  >([]);

  const navigate = useNavigate();

  // Initialize component with predefined filters if provided
  useEffect(() => {
    if (employeeId) {
      setFilterEmployeeId(employeeId);
    }

    if (loanId) {
      setFilterLoanId(loanId);
    }
  }, [employeeId, loanId]);

  // Load data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load employees for filtering
        const employeeData = await getAllActiveEmployees();
        setEmployees(employeeData);

        // Load repayments based on filters
        let repaymentData: LoanRepay[];

        if (loanId) {
          repaymentData = await getRepaymentsByLoanId(loanId);

          // Also load the loan details
          try {
            const loanDetails = await getLoanById(loanId);
            setLoans([loanDetails]);
          } catch (err) {
            console.error("Error loading loan details:", err);
          }
        } else if (employeeId) {
          repaymentData = await getRepaymentsByEmployeeId(employeeId);
        } else {
          repaymentData = await getAllRepayments();
        }

        // Enrich repayments with employee names
        const enrichedRepayments = repaymentData.map((repayment) => {
          const employee = employeeData.find(
            (emp) => emp.id === repayment.employeeId
          );
          return {
            ...repayment,
            employeeName: employee ? employee.name : "Unknown Employee",
          };
        });

        setRepayments(enrichedRepayments);
        setFilteredRepayments(enrichedRepayments);

        // Calculate metrics
        calculateMetrics(enrichedRepayments);

        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading repayments:", err);
        setError(err.message || "Failed to load repayment data");
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [employeeId, loanId]);

  // Calculate summary metrics
  const calculateMetrics = (data: LoanRepay[]) => {
    // Total amount repaid
    const total = data.reduce((sum, item) => sum + item.repayAmount, 0);
    setTotalRepayments(total);

    // Calculate monthly trends (last 6 months)
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString("default", { month: "short" });

      // Filter repayments for this month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthlyAmount = data.reduce((sum, repayment) => {
        const repayDate = new Date(repayment.repayDate);
        if (repayDate >= startDate && repayDate <= endDate) {
          return sum + repayment.repayAmount;
        }
        return sum;
      }, 0);

      months.push({ month: monthName, amount: monthlyAmount });
    }

    setMonthlyTrend(months);
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    setIsLoading(true);

    try {
      let filtered = [...repayments];

      // Employee filter
      if (filterEmployeeId !== "") {
        filtered = filtered.filter(
          (repay) => repay.employeeId === filterEmployeeId
        );
      }

      // Loan filter
      if (filterLoanId !== "") {
        filtered = filtered.filter((repay) => repay.loanId === filterLoanId);
      }

      // Date range filter
      if (filterStartDate && filterEndDate) {
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59);

        filtered = filtered.filter((repay) => {
          const repayDate = new Date(repay.repayDate);
          return repayDate >= startDate && repayDate <= endDate;
        });
      } else if (filterStartDate) {
        const startDate = new Date(filterStartDate);
        filtered = filtered.filter(
          (repay) => new Date(repay.repayDate) >= startDate
        );
      } else if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59);
        filtered = filtered.filter(
          (repay) => new Date(repay.repayDate) <= endDate
        );
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((repay) => {
          return (
            (repay.employeeName &&
              repay.employeeName.toLowerCase().includes(query)) ||
            repay.repayAmount.toString().includes(query) ||
            repay.loanId.toString().includes(query)
          );
        });
      }

      // Apply sorting
      switch (sortOption) {
        case "newest":
          filtered.sort(
            (a, b) =>
              new Date(b.repayDate).getTime() - new Date(a.repayDate).getTime()
          );
          break;
        case "oldest":
          filtered.sort(
            (a, b) =>
              new Date(a.repayDate).getTime() - new Date(b.repayDate).getTime()
          );
          break;
        case "amount_high":
          filtered.sort((a, b) => b.repayAmount - a.repayAmount);
          break;
        case "amount_low":
          filtered.sort((a, b) => a.repayAmount - b.repayAmount);
          break;
        default:
          filtered.sort(
            (a, b) =>
              new Date(b.repayDate).getTime() - new Date(a.repayDate).getTime()
          );
      }

      setFilteredRepayments(filtered);
      calculateMetrics(filtered);
    } catch (err) {
      console.error("Error applying filters:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    repayments,
    filterEmployeeId,
    filterLoanId,
    filterStartDate,
    filterEndDate,
    searchQuery,
    sortOption,
  ]);

  // Apply filters when filter criteria change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reset all filters
  const resetFilters = () => {
    setFilterEmployeeId("");
    setFilterLoanId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchQuery("");
    setSortOption("newest");
  };

  // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        }).format(amount);
    };
  

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // View repayment details
  const handleViewDetails = (repayment: LoanRepay) => {
    if (onViewDetails) {
      onViewDetails(repayment);
    } else {
      setSelectedRepayment(repayment);
      setShowDetailPanel(true);
    }
  };

  // Delete repayment
  const confirmDelete = (repayment: LoanRepay) => {
    setRepaymentToDelete(repayment);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!repaymentToDelete || !repaymentToDelete.id) return;

    setIsLoading(true);

    try {
      await deleteRepayment(repaymentToDelete.id);

      // Update state to remove the deleted repayment
      setRepayments((prev) =>
        prev.filter((r) => r.id !== repaymentToDelete.id)
      );
      setFilteredRepayments((prev) =>
        prev.filter((r) => r.id !== repaymentToDelete.id)
      );

      setShowDeleteModal(false);
      setRepaymentToDelete(null);
    } catch (err: any) {
      console.error("Error deleting repayment:", err);
      setError(err.message || "Failed to delete repayment");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new repayment
  const handleAddRepayment = () => {
    if (onAddRepayment) {
      onAddRepayment();
    } else {
      navigate("/loan-repay/add");
    }
  };

  // Toggle panel expansion
  const toggleExpand = (id: number) => {
    setExpandedRepaymentId(expandedRepaymentId === id ? null : id);
  };

  // Close detail panel
  const closeDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedRepayment(null);
  };

  // Get color based on amount (higher amount = deeper color)
  const getAmountColor = (amount: number): string => {
    const maxAmount = Math.max(...repayments.map((r) => r.repayAmount), 1);
    const intensity = Math.min(0.2 + (amount / maxAmount) * 0.8, 1);
    return `rgba(74, 109, 167, ${intensity})`;
  };

  return (
    <div className={`loan-repay-list-container ${viewMode}`}>
      {/* Detail Panel */}
      {showDetailPanel && selectedRepayment && (
        <div className="detail-panel-overlay">
          <div className="detail-panel">
            <div className="detail-panel-header">
              <h3>Repayment Details</h3>
              <button className="close-panel-btn" onClick={closeDetailPanel}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-amount">
                {formatCurrency(selectedRepayment.repayAmount)}
              </div>

              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <div className="detail-label">Employee</div>
                  <div className="detail-value">
                    {selectedRepayment.employeeName}
                  </div>
                </div>

                <div className="detail-info-item">
                  <div className="detail-label">Payment Date</div>
                  <div className="detail-value">
                    {formatDate(selectedRepayment.repayDate)}
                  </div>
                </div>

                <div className="detail-info-item">
                  <div className="detail-label">Loan ID</div>
                  <div className="detail-value">{selectedRepayment.loanId}</div>
                </div>

                <div className="detail-info-item">
                  <div className="detail-label">Payment ID</div>
                  <div className="detail-value">{selectedRepayment.id}</div>
                </div>
              </div>

              <div className="detail-panel-actions">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    closeDetailPanel();
                    confirmDelete(selectedRepayment);
                  }}
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="loan-repay-list-header">
        <div className="header-title">
          <h2>
            <i className="bi bi-credit-card"></i> Loan Repayments
          </h2>
          <p className="subtitle">View and manage loan repayment records</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddRepayment}>
            <i className="bi bi-plus-circle"></i> Record Repayment
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="analytics-dashboard">
        <div className="metric-card total-repayments">
          <div className="metric-icon">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {formatCurrency(totalRepayments)}
            </div>
            <div className="metric-label">Total Repayments</div>
          </div>
        </div>

        <div className="metric-card repayment-count">
          <div className="metric-icon">
            <i className="bi bi-list-check"></i>
          </div>
          <div className="metric-content">
            <div className="metric-value">{filteredRepayments.length}</div>
            <div className="metric-label">Repayments</div>
          </div>
        </div>

        <div className="metric-card trend-chart">
          <h4 className="chart-title">Monthly Repayments</h4>
          <div className="chart-container">
            {monthlyTrend.map((item, index) => {
              const maxAmount = Math.max(
                ...monthlyTrend.map((m) => m.amount || 0),
                1
              );
              const height = `${Math.max((item.amount / maxAmount) * 100, 4)}%`;

              return (
                <div className="chart-bar-container" key={index}>
                  <div
                    className="chart-bar"
                    style={{ height }}
                    data-value={formatCurrency(item.amount)}
                  ></div>
                  <div className="chart-label">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="search-container">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search repayments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={filterEmployeeId}
            onChange={(e) =>
              setFilterEmployeeId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={!!employeeId} // Disable if employeeId is provided as prop
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterLoanId}
            onChange={(e) =>
              setFilterLoanId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={!!loanId} // Disable if loanId is provided as prop
          >
            <option value="">All Loans</option>
            {loans.map((loan) => (
              <option key={loan.loanId} value={loan.loanId}>
                Loan #{loan.loanId}
              </option>
            ))}
          </select>

          <div className="date-filter">
            <div className="date-input-group">
              <label className="date-label">From</label>
              <input
                type="date"
                className="date-input"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div className="date-input-group">
              <label className="date-label">To</label>
              <input
                type="date"
                className="date-input"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                min={filterStartDate}
              />
            </div>
          </div>

          <select
            className="filter-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Amount (High to Low)</option>
            <option value="amount_low">Amount (Low to High)</option>
          </select>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <i className="bi bi-grid-3x3-gap"></i>
            </button>
            <button
              className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
            >
              <i className="bi bi-calendar-week"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filterEmployeeId !== "" ||
        filterLoanId !== "" ||
        filterStartDate ||
        filterEndDate ||
        searchQuery) && (
        <div className="active-filters">
          <div className="filter-tags">
            <span className="filter-label">Active filters:</span>

            {filterEmployeeId !== "" && (
              <div className="filter-tag">
                <i className="bi bi-person"></i>
                <span>
                  {employees.find((e) => e.id === filterEmployeeId)?.name ||
                    `Employee #${filterEmployeeId}`}
                </span>
                <button
                  onClick={() => setFilterEmployeeId("")}
                  disabled={!!employeeId}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {filterLoanId !== "" && (
              <div className="filter-tag">
                <i className="bi bi-cash-coin"></i>
                <span>Loan #{filterLoanId}</span>
                <button onClick={() => setFilterLoanId("")} disabled={!!loanId}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {(filterStartDate || filterEndDate) && (
              <div className="filter-tag">
                <i className="bi bi-calendar-range"></i>
                <span>
                  {filterStartDate ? formatDate(filterStartDate) : "Any"} -
                  {filterEndDate ? formatDate(filterEndDate) : "Any"}
                </span>
                <button
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {searchQuery && (
              <div className="filter-tag">
                <i className="bi bi-search"></i>
                <span>"{searchQuery}"</span>
                <button onClick={() => setSearchQuery("")}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset All
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading repayments...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="error-container">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Error Loading Repayments</h3>
          <p>{error}</p>
          <button
            className="btn btn-primary retry-btn"
            onClick={() => applyFilters()}
          >
            <i className="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredRepayments.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-credit-card"></i>
          </div>
          <h3>No Repayments Found</h3>
          <p>
            {repayments.length === 0
              ? "No loan repayments have been recorded yet."
              : "No repayments match your current filters."}
          </p>
          {repayments.length === 0 ? (
            <button className="btn btn-primary" onClick={handleAddRepayment}>
              <i className="bi bi-plus-circle"></i> Record First Repayment
            </button>
          ) : (
            <button className="btn btn-outline-primary" onClick={resetFilters}>
              <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
            </button>
          )}
        </div>
      )}

      {/* List View */}
      {!isLoading &&
        !error &&
        filteredRepayments.length > 0 &&
        viewMode === "list" && (
          <div className="repayments-list">
            <table className="repayments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Loan ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepayments.map((repayment) => (
                  <tr
                    key={repayment.id}
                    className={
                      expandedRepaymentId === repayment.id ? "expanded" : ""
                    }
                  >
                    <td className="id-cell">{repayment.id}</td>
                    <td>{repayment.employeeName}</td>
                    <td className="loan-id-cell">{repayment.loanId}</td>
                    <td className="amount-cell">
                      <span
                        className="amount-pill"
                        style={{
                          backgroundColor: getAmountColor(
                            repayment.repayAmount
                          ),
                        }}
                      >
                        {formatCurrency(repayment.repayAmount)}
                      </span>
                    </td>
                    <td className="date-cell">
                      {formatDate(repayment.repayDate)}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewDetails(repayment)}
                        aria-label="View details"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => confirmDelete(repayment)}
                        aria-label="Delete repayment"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                      <button
                        className="action-btn expand-btn"
                        onClick={() => toggleExpand(repayment.id || 0)}
                        aria-label={
                          expandedRepaymentId === repayment.id
                            ? "Collapse"
                            : "Expand"
                        }
                      >
                        <i
                          className={`bi bi-chevron-${
                            expandedRepaymentId === repayment.id ? "up" : "down"
                          }`}
                        ></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Grid View */}
      {!isLoading &&
        !error &&
        filteredRepayments.length > 0 &&
        viewMode === "grid" && (
          <div className="repayments-grid">
            {filteredRepayments.map((repayment) => (
              <div className="repayment-card" key={repayment.id}>
                <div
                  className="card-amount"
                  style={{
                    backgroundColor: getAmountColor(repayment.repayAmount),
                  }}
                >
                  {formatCurrency(repayment.repayAmount)}
                </div>

                <div className="card-details">
                  <div className="detail-row">
                    <span className="detail-label">Employee:</span>
                    <span className="detail-value">
                      {repayment.employeeName}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Loan ID:</span>
                    <span className="detail-value">#{repayment.loanId}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {formatDate(repayment.repayDate)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Payment ID:</span>
                    <span className="detail-value">#{repayment.id}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="card-action-btn view-btn"
                    onClick={() => handleViewDetails(repayment)}
                    aria-label="View details"
                  >
                    <i className="bi bi-eye"></i> Details
                  </button>
                  <button
                    className="card-action-btn delete-btn"
                    onClick={() => confirmDelete(repayment)}
                    aria-label="Delete repayment"
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Calendar View */}
      {!isLoading &&
        !error &&
        filteredRepayments.length > 0 &&
        viewMode === "calendar" && (
          <div className="calendar-view-wrapper">
            <CalendarViewComponent
              repayments={filteredRepayments}
              onViewDetails={handleViewDetails}
              formatCurrency={formatCurrency}
            />
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && repaymentToDelete && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <p>
                Are you sure you want to delete this repayment of{" "}
                {formatCurrency(repaymentToDelete.repayAmount)}?
              </p>
              <p className="warning-text">
                This action cannot be undone. The amount will no longer count
                towards the loan repayment.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <i className="bi bi-trash"></i> Delete Repayment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Button for Mobile */}
      <button className="floating-add-btn" onClick={handleAddRepayment}>
        <i className="bi bi-plus-lg"></i>
      </button>
    </div>
  );
};

// Calendar View Component
interface CalendarProps {
  repayments: LoanRepay[];
  onViewDetails: (repayment: LoanRepay) => void;
  formatCurrency: (amount: number) => string;
}

const CalendarViewComponent: React.FC<CalendarProps> = ({
  repayments,
  onViewDetails,
  formatCurrency,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<
    Array<{ date: Date | null; repayments: LoanRepay[] }>
  >([]);

  // Generate calendar days for current month
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // Get the first day of the month
      const firstDay = new Date(year, month, 1);
      const firstDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get the last day of the month
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      const days: Array<{ date: Date | null; repayments: LoanRepay[] }> = [];

      // Add empty slots for days before the first day of the month
      for (let i = 0; i < firstDayIndex; i++) {
        days.push({ date: null, repayments: [] });
      }

      // Add days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);

        // Find repayments for this day
        const dayRepayments = repayments.filter((repayment) => {
          const repayDate = new Date(repayment.repayDate);
          return (
            repayDate.getFullYear() === date.getFullYear() &&
            repayDate.getMonth() === date.getMonth() &&
            repayDate.getDate() === date.getDate()
          );
        });

        days.push({ date, repayments: dayRepayments });
      }

      setCalendarDays(days);
    };

    generateCalendarDays();
  }, [currentMonth, repayments]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Navigate to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Format date for display
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Calculate total for a day
  const calculateDayTotal = (dayRepayments: LoanRepay[]): number => {
    return dayRepayments.reduce(
      (sum, repayment) => sum + repayment.repayAmount,
      0
    );
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        <div className="current-month">
          <h3>{formatMonthYear(currentMonth)}</h3>
          <button
            className="today-btn"
            onClick={goToCurrentMonth}
            aria-label="Go to current month"
          >
            Today
          </button>
        </div>

        <button
          className="calendar-nav-btn"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      <div className="calendar-weekdays">
        <div className="weekday">Sun</div>
        <div className="weekday">Mon</div>
        <div className="weekday">Tue</div>
        <div className="weekday">Wed</div>
        <div className="weekday">Thu</div>
        <div className="weekday">Fri</div>
        <div className="weekday">Sat</div>
      </div>

      <div className="calendar-days">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${!day.date ? "empty" : ""} ${
              day.date &&
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear()
                ? "today"
                : ""
            }`}
          >
            {day.date && (
              <>
                <div className="day-number">{day.date.getDate()}</div>

                {day.repayments.length > 0 && (
                  <div className="day-repayments">
                    <div className="day-total">
                      {formatCurrency(calculateDayTotal(day.repayments))}
                    </div>

                    {day.repayments.map((repayment) => (
                      <div
                        key={repayment.id}
                        className="calendar-repayment"
                        onClick={() => onViewDetails(repayment)}
                      >
                        <i className="bi bi-credit-card"></i>
                        <span>{formatCurrency(repayment.repayAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoanRepayList;