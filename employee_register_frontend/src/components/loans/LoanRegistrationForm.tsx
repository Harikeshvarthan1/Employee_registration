import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LoanRegistrationFormData } from "../../models/types";
import { getAllActiveEmployees } from "../../apis/employeeApi";
import { registerLoan } from "../../apis/loanRegistrationApi";
import "./LoanRegistrationForm.css";

interface LoanRegistrationFormProps {
  onSuccess?: (loanId: number) => void;
  onCancel?: () => void;
}

const LoanRegistrationForm: React.FC<LoanRegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Form data state
  const [formData, setFormData] = useState<LoanRegistrationFormData>({
    employeeId: 0,
    loanDate: new Date().toISOString().split("T")[0],
    loanAmount: 0,
    reason: "",
    status: "active",
  });

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<
    { id: number; name: string; role: string; baseSalary: number }[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [formStage, setFormStage] = useState<"employee" | "details">(
    "employee"
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [showReason, setShowReason] = useState<boolean>(false);
  const [reasonLength, setReasonLength] = useState<number>(0);

  const navigate = useNavigate();

  // Load active employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getAllActiveEmployees();
        setEmployees(
          data.map((emp) => ({
            id: emp.id!,
            name: emp.name,
            role: emp.role,
            baseSalary: emp.baseSalary,
          }))
        );

        // Mock data for recent loans
        setRecentLoans([
          {
            id: 1,
            employeeName: "John Smith",
            amount: 2500,
            date: "2023-05-15",
          },
          {
            id: 2,
            employeeName: "Emily Johnson",
            amount: 1800,
            date: "2023-06-02",
          },
          {
            id: 3,
            employeeName: "Michael Brown",
            amount: 3000,
            date: "2023-06-18",
          },
        ]);

        // Set current month for statistics
        const date = new Date();
        setCurrentMonth(date.toLocaleString("default", { month: "long" }));

        // Set max date to today
        setMaxDate(new Date().toISOString().split("T")[0]);
      } catch (error) {
        console.error("Failed to load employees", error);
      }
    };

    loadEmployees();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = useCallback(() => {
    if (!searchTerm.trim()) return employees;

    const term = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "reason") {
      setReasonLength(value.length);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "loanAmount" ? parseFloat(value) || 0 : value,
    }));

    // Clear error for this field if any
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Select an employee
  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData((prev) => ({ ...prev, employeeId: employee.id }));
    setShowDropdown(false);
    setSearchTerm(employee.name);
    setErrors((prev) => ({ ...prev, employeeId: "" }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select an employee";
    }

    if (!formData.loanDate) {
      newErrors.loanDate = "Loan date is required";
    }

    if (!formData.loanAmount || formData.loanAmount <= 0) {
      newErrors.loanAmount = "Please enter a valid loan amount";
    } else if (formData.loanAmount > 10000) {
      newErrors.loanAmount = "Loan amount cannot exceed $10,000";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Please provide a reason for the loan";
    } else if (formData.reason.length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
    // Create the loan payload with proper types
    const loanPayload = {
      employeeId: Number(formData.employeeId), // Ensure employeeId is a number
      loanAmount: formData.loanAmount,
      reason: formData.reason,
      loanDate: formData.loanDate,
      status: formData.status
    };

    console.log('Sending loan data:', loanPayload);
    const result = await registerLoan(loanPayload);
    console.log('Loan registered successfully:', result);

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        if (onSuccess) {
          onSuccess(result.loanId!);
        } else {
          navigate("/loan-register");
        }
      }, 2000);
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to register loan. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

    // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };


  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/loan-register");
    }
  };

  // Proceed to next form stage
  const proceedToDetails = () => {
    if (!formData.employeeId) {
      setErrors((prev) => ({
        ...prev,
        employeeId: "Please select an employee",
      }));
      return;
    }
    setFormStage("details");
  };

  // Go back to employee selection
  const goBackToEmployeeSelection = () => {
    setFormStage("employee");
  };

  // Calculate maximum loan amount based on employee salary
  const getMaxLoanAmount = (): number => {
    if (!selectedEmployee) return 0;
    // Maximum loan is 3x monthly salary
    return selectedEmployee.baseSalary * 3;
  };

  return (
    <div className="loan-registration-form-container">
      {showSuccessMessage && (
        <div className="success-message">
          <div className="success-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="success-content">
            <h3>Loan Registered Successfully!</h3>
            <p>The loan has been registered and is now active.</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="loan-form-card">
        <div className="card-header">
          <h2 className="form-title">
            <i className="bi bi-cash-coin"></i> Register New Loan
          </h2>
          <p className="form-subtitle">
            Create a new loan record for an active employee
          </p>
        </div>

        <div className="form-progress">
          <div
            className={`progress-step ${
              formStage === "employee" ? "active" : "completed"
            }`}
          >
            <div className="step-indicator">
              {formStage === "employee" ? "1" : <i className="bi bi-check"></i>}
            </div>
            <div className="step-label">Select Employee</div>
          </div>
          <div className="progress-connector"></div>
          <div
            className={`progress-step ${
              formStage === "details" ? "active" : ""
            }`}
          >
            <div className="step-indicator">2</div>
            <div className="step-label">Loan Details</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Employee Selection Stage */}
          {formStage === "employee" && (
            <div className="form-stage employee-stage">
              <div className="employee-search-container">
                <div
                  className={`form-group ${
                    errors.employeeId ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="employeeSearch" className="form-label">
                    <i className="bi bi-person-fill"></i> Select Employee
                    <span className="required">*</span>
                  </label>
                  <div className="employee-search-input">
                    <i className="bi bi-search search-icon"></i>
                    <input
                      type="text"
                      id="employeeSearch"
                      placeholder="Search employees by name or role..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedEmployee(null);
                          setFormData((prev) => ({ ...prev, employeeId: 0 }));
                        }}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>
                  {errors.employeeId && (
                    <div className="error-text">{errors.employeeId}</div>
                  )}
                </div>

                {showDropdown && (
                  <div className="employee-dropdown">
                    {filteredEmployees().length > 0 ? (
                      filteredEmployees().map((employee) => (
                        <div
                          key={employee.id}
                          className="employee-option"
                          onClick={() => handleSelectEmployee(employee)}
                        >
                          <div className="employee-avatar">
                            {employee.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="employee-details">
                            <div className="employee-name">{employee.name}</div>
                            <div className="employee-role">{employee.role}</div>
                          </div>
                          <div className="employee-salary">
                            {formatCurrency(employee.baseSalary)}/month
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        <i className="bi bi-emoji-frown"></i>
                        <p>No employees found matching "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedEmployee && (
                <div className="selected-employee">
                  <div className="card-title">Selected Employee</div>
                  <div className="employee-card">
                    <div className="employee-card-header">
                      <div className="employee-avatar large">
                        {selectedEmployee.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="employee-main-details">
                        <h3>{selectedEmployee.name}</h3>
                        <div className="employee-role-badge">
                          {selectedEmployee.role}
                        </div>
                      </div>
                    </div>
                    <div className="employee-card-body">
                      <div className="detail-item">
                        <div className="detail-label">Monthly Salary</div>
                        <div className="detail-value">
                          {formatCurrency(selectedEmployee.baseSalary)}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Maximum Loan</div>
                        <div className="detail-value highlight">
                          {formatCurrency(getMaxLoanAmount())}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="stage-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={proceedToDetails}
                  disabled={!selectedEmployee}
                >
                  <span>Continue</span>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Loan Details Stage */}
          {formStage === "details" && selectedEmployee && (
            <div className="form-stage details-stage">
              <div className="selected-employee-bar">
                <div className="employee-quick-info">
                  <div className="employee-avatar small">
                    {selectedEmployee.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="employee-name">{selectedEmployee.name}</div>
                </div>
                <button
                  type="button"
                  className="change-employee-btn"
                  onClick={goBackToEmployeeSelection}
                >
                  <i className="bi bi-pencil"></i> Change
                </button>
              </div>

              <div className="form-row">
                <div
                  className={`form-group ${errors.loanDate ? "has-error" : ""}`}
                >
                  <label htmlFor="loanDate" className="form-label">
                    <i className="bi bi-calendar-date"></i> Loan Date
                    <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="loanDate"
                    name="loanDate"
                    value={formData.loanDate}
                    onChange={handleInputChange}
                    max={maxDate}
                    className="form-control"
                  />
                  {errors.loanDate && (
                    <div className="error-text">{errors.loanDate}</div>
                  )}
                </div>

                <div
                  className={`form-group ${
                    errors.loanAmount ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="loanAmount" className="form-label">
                    <i className="bi bi-cash-stack"></i> Loan Amount
                    <span className="required">*</span>
                  </label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      id="loanAmount"
                      name="loanAmount"
                      value={formData.loanAmount || ""}
                      onChange={handleInputChange}
                      min="1"
                      max={getMaxLoanAmount()}
                      step="100"
                      className="form-control"
                      placeholder="Enter loan amount"
                    />
                  </div>
                  {errors.loanAmount && (
                    <div className="error-text">{errors.loanAmount}</div>
                  )}
                  <div className="max-loan-info">
                    <span>Max: {formatCurrency(getMaxLoanAmount())}</span>
                    {formData.loanAmount > 0 && (
                      <span className="loan-percentage">
                        (
                        {Math.round(
                          (formData.loanAmount / getMaxLoanAmount()) * 100
                        )}
                        % of max)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`form-group ${errors.reason ? "has-error" : ""}`}>
                <label htmlFor="reason" className="form-label">
                  <i className="bi bi-chat-left-text"></i> Reason for Loan
                  <span className="required">*</span>
                </label>
                <div className="reason-textarea-container">
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    onFocus={() => setShowReason(true)}
                    onBlur={() => setShowReason(false)}
                    className={`form-control ${showReason ? "expanded" : ""}`}
                    placeholder="Explain why this loan is needed..."
                    rows={3}
                  ></textarea>
                  <div className="character-count">
                    <span className={reasonLength < 10 ? "text-danger" : ""}>
                      {reasonLength}/500
                    </span>
                  </div>
                </div>
                {errors.reason && (
                  <div className="error-text">{errors.reason}</div>
                )}
              </div>

              {/* Loan Summary */}
              {formData.loanAmount > 0 && (
                <div className="loan-summary">
                  <h3 className="summary-title">Loan Summary</h3>
                  <div className="summary-content">
                    <div className="summary-row">
                      <div className="summary-label">Employee</div>
                      <div className="summary-value">
                        {selectedEmployee.name}
                      </div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-label">Loan Date</div>
                      <div className="summary-value">
                        {formData.loanDate
                          ? formatDate(formData.loanDate)
                          : "Not specified"}
                      </div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-label">Loan Amount</div>
                      <div className="summary-value highlight">
                        {formatCurrency(formData.loanAmount)}
                      </div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-label">Status</div>
                      <div className="summary-value">
                        <span className="status-badge active">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="submit-error">
                  <i className="bi bi-exclamation-triangle"></i>
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="stage-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={goBackToEmployeeSelection}
                >
                  <i className="bi bi-arrow-left"></i> Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="loader"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      <span>Register Loan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Recent Loans Section */}
      <div className="recent-loans-section">
        <h3 className="section-title">
          <i className="bi bi-clock-history"></i>
          Recent Loans
        </h3>

        <div className="loan-stats">
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(7300)}</div>
            <div className="stat-label">Total Loans ({currentMonth})</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">8</div>
            <div className="stat-label">Active Loans</div>
          </div>
        </div>

        <div className="recent-loans-list">
          {recentLoans.map((loan) => (
            <div key={loan.id} className="recent-loan-item">
              <div className="loan-employee">{loan.employeeName}</div>
              <div className="loan-amount">{formatCurrency(loan.amount)}</div>
              <div className="loan-date">{formatDate(loan.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoanRegistrationForm;