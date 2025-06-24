import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee, Salary } from "../../models/types";
import { getAllActiveEmployees } from "../../apis/employeeApi";
import {
  addSalary,
  updateSalary,
  getLatestSalaryByEmployeeId,
} from "../../apis/salaryApi";
import "./SalaryForm.css";

interface SalaryFormProps {
  salary?: Salary; // For edit mode
  onSuccess?: (salary: Salary) => void;
  onCancel?: () => void;
  preselectedEmployeeId?: number;
}

const SalaryForm: React.FC<SalaryFormProps> = ({
  salary,
  onSuccess,
  onCancel,
  preselectedEmployeeId,
}) => {
  // Form data state
  const [formData, setFormData] = useState<{
    id?: number;
    employeeId: number | "";
    datePaid: string;
    paymentType: "daily_credit" | "salary";
    amount: number;
    lastSalaryDate: string;
  }>({
    employeeId: preselectedEmployeeId || "",
    datePaid: new Date().toISOString().split("T")[0],
    paymentType: "salary",
    amount: 0,
    lastSalaryDate: "",
  });

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showSuccessAnimation, setShowSuccessAnimation] =
    useState<boolean>(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [previousSalaries, setPreviousSalaries] = useState<Salary[]>([]);
  const [amountFocused, setAmountFocused] = useState<boolean>(false);
  const [showSuggestedAmount, setShowSuggestedAmount] =
    useState<boolean>(false);
  const [amountSuggestion, setAmountSuggestion] = useState<number | null>(null);
  const [animateAmount, setAnimateAmount] = useState<boolean>(false);

  // Refs
  const amountInputRef = useRef<HTMLInputElement>(null);
  const suggestedAmountRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Load employees and initialize form data
  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const employeeData = await getAllActiveEmployees();
        setEmployees(employeeData);

        // If we're in edit mode, populate form data
        if (salary) {
          const employeePaid =
            employeeData.find((emp) => emp.id === salary.employeeId) || null;
          setSelectedEmployee(employeePaid);

          const formattedDatePaid = formatDateForInput(salary.datePaid);
          const formattedLastSalaryDate = formatDateForInput(
            salary.lastSalaryDate || ""
          );

          setFormData({
            id: salary.id,
            employeeId: salary.employeeId,
            datePaid: formattedDatePaid,
            paymentType: salary.paymentType,
            amount: salary.amount,
            lastSalaryDate: formattedLastSalaryDate,
          });
        }
        // If preselected employee, set that employee
        else if (preselectedEmployeeId) {
          const preselectedEmployee =
            employeeData.find((emp) => emp.id === preselectedEmployeeId) ||
            null;
          setSelectedEmployee(preselectedEmployee);

          if (preselectedEmployee) {
            loadPreviousSalaryData(preselectedEmployeeId);
            calculateSuggestedAmount(preselectedEmployee);
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading employees:", err);
        setError(err.message || "Failed to load employees. Please try again.");
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [salary, preselectedEmployeeId]);

  // Helper function to format date for input field
  const formatDateForInput = (date: string | Date): string => {
    if (!date) return "";

    if (typeof date === "string") {
      // Check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      date = new Date(date);
    }

    return date.toISOString().split("T")[0];
  };

  // Load previous salary data for an employee
  const loadPreviousSalaryData = async (employeeId: number) => {
    try {
      // In a real app, you'd have an API endpoint to get salary history
      // For now, we'll just get the latest salary as an example
      const latestSalary = await getLatestSalaryByEmployeeId(employeeId);
      setPreviousSalaries(latestSalary ? [latestSalary] : []);

      // Set last salary date if available
      if (latestSalary && latestSalary.datePaid) {
        setFormData((prev) => ({
          ...prev,
          lastSalaryDate: formatDateForInput(latestSalary.datePaid),
        }));
      }
    } catch (err) {
      console.error("Error loading previous salary data:", err);
      // Don't show an error to the user for this - it's not critical
      setPreviousSalaries([]);
    }
  };

  // Calculate a suggested amount based on employee's base salary
  const calculateSuggestedAmount = (employee: Employee) => {
    if (!employee || !employee.baseSalary) return;

    // For a monthly payment, suggest the full base salary
    let suggestion = employee.baseSalary;

    // Check if we're near month end to make a better suggestion
    const today = new Date();
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    // If we're in the last 3 days of the month, suggest full salary
    const isMonthEnd = dayOfMonth >= lastDayOfMonth - 2;

    // If it's not month end and we're setting a daily credit, suggest a partial amount
    if (!isMonthEnd && formData.paymentType === "daily_credit") {
      suggestion = Math.round(employee.baseSalary / 4); // Weekly amount as a suggestion
    }

    setAmountSuggestion(suggestion);
  };

  // Handle form field changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number = value;

    // Parse number inputs
    if (type === "number") {
      parsedValue = value === "" ? 0 : Number(value);
    }

    // Special handling for payment type change
    if (name === "paymentType") {
      const newPaymentType = value as "daily_credit" | "salary";

      // Adjust amount suggestion based on payment type
      if (selectedEmployee) {
        if (newPaymentType === "salary") {
          setAmountSuggestion(selectedEmployee.baseSalary);
        } else {
          // For daily credit, suggest 1/4th of base salary
          setAmountSuggestion(Math.round(selectedEmployee.baseSalary / 4));
        }

        setShowSuggestedAmount(true);
        setTimeout(() => setShowSuggestedAmount(false), 5000);
      }
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle employee selection change
  const handleEmployeeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const employeeId = e.target.value ? Number(e.target.value) : "";

    // Update form data with selected employee
    setFormData((prev) => ({
      ...prev,
      employeeId,
    }));

    // Clear validation error
    if (validationErrors.employeeId) {
      setValidationErrors((prev) => ({
        ...prev,
        employeeId: "",
      }));
    }

    // Find selected employee object
    if (employeeId !== "") {
      const employee = employees.find((emp) => emp.id === employeeId) || null;
      setSelectedEmployee(employee);

      if (employee) {
        // Load previous salary data
        await loadPreviousSalaryData(employeeId as number);

        // Calculate suggested amount
        calculateSuggestedAmount(employee);

        // Show suggestion briefly
        setShowSuggestedAmount(true);
        setTimeout(() => setShowSuggestedAmount(false), 5000);
      }
    } else {
      setSelectedEmployee(null);
      setPreviousSalaries([]);
      setAmountSuggestion(null);
    }
  };

  // Apply suggested amount
  const applySuggestedAmount = () => {
    if (amountSuggestion !== null) {
      setFormData((prev) => ({
        ...prev,
        amount: amountSuggestion,
      }));

      setAnimateAmount(true);
      setTimeout(() => setAnimateAmount(false), 1000);

      setShowSuggestedAmount(false);

      // Focus the amount input
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    }
  };

  // Format currency for display
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
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get payment type label
  const getPaymentTypeLabel = (type: "daily_credit" | "salary"): string => {
    return type === "salary" ? "Monthly Salary" : "Daily Credit";
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.employeeId) {
      errors.employeeId = "Please select an employee";
    }

    if (!formData.datePaid) {
      errors.datePaid = "Payment date is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    // For salary type, last salary date is required
    if (formData.paymentType === "salary" && !formData.lastSalaryDate) {
      errors.lastSalaryDate =
        "Last salary date is required for monthly payments";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let result: Salary;

      const payloadData = {
        ...formData,
        employeeId: Number(formData.employeeId),
      };

      if (salary?.id) {
        // Update existing salary
        result = await updateSalary(salary.id, payloadData);
      } else {
        // Add new salary
        result = await addSalary(payloadData);
      }

      setShowSuccessAnimation(true);

      setTimeout(() => {
        setShowSuccessAnimation(false);

        if (onSuccess) {
          onSuccess(result);
        } else {
          // Reset form for another entry or navigate away
          if (!salary) {
            // If it was a new entry, reset form but keep the same employee selected
            const currentEmployeeId = formData.employeeId;
            setFormData({
              employeeId: currentEmployeeId,
              datePaid: new Date().toISOString().split("T")[0],
              paymentType: "salary",
              amount: 0,
              lastSalaryDate: formData.datePaid, // Use current payment as last payment date
            });
          } else {
            // If it was an edit, navigate back
            navigate(-1);
          }
        }
      }, 2000);
    } catch (err: any) {
      console.error("Error saving salary:", err);
      setError(err.message || "Failed to save salary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="salary-form-container">
      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="success-animation-container">
          <div className="success-animation">
            <div className="checkmark-container">
              <svg
                className="checkmark"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle
                  className="checkmark-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className="checkmark-check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <h3 className="success-message">
              {salary ? "Salary Updated!" : "Payment Recorded!"}
            </h3>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <i className="bi bi-exclamation-triangle"></i>
          <span>{error}</span>
          <button className="error-close-btn" onClick={() => setError(null)}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      <div className="salary-form-card">
        <div className="form-header">
          <h2>
            <i className="bi bi-currency-rupee"></i>
            {salary ? "Edit Salary Payment" : "Record Salary Payment"}
          </h2>
          <p className="form-subtitle">
            {salary
              ? "Update salary payment details"
              : "Record a new salary payment for an employee"}
          </p>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit}>
            {/* Employee Selection */}
            <div
              className={`form-group ${
                validationErrors.employeeId ? "has-error" : ""
              }`}
            >
              <label htmlFor="employeeId">
                <i className="bi bi-person"></i> Employee
              </label>
              <select
                id="employeeId"
                name="employeeId"
                className="form-control"
                value={formData.employeeId}
                onChange={handleEmployeeChange}
                disabled={
                  isLoading || isSaving || !!salary || !!preselectedEmployeeId
                }
              >
                <option value="">-- Select Employee --</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.role})
                  </option>
                ))}
              </select>
              {validationErrors.employeeId && (
                <div className="error-text">{validationErrors.employeeId}</div>
              )}
            </div>

            {/* Employee Summary Card (if selected) */}
            {selectedEmployee && (
              <div className="employee-summary-card">
                <div className="employee-avatar">
                  <span className="avatar-text">
                    {selectedEmployee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div className="employee-details">
                  <div className="employee-name">{selectedEmployee.name}</div>
                  <div className="employee-role">{selectedEmployee.role}</div>

                  <div className="employee-stats">
                    <div className="stat-item">
                      <span className="stat-label">Base Salary</span>
                      <span className="stat-value">
                        {formatCurrency(selectedEmployee.baseSalary)}/month
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">Join Date</span>
                      <span className="stat-value">
                        {formatDate(selectedEmployee.joinDate)}
                      </span>
                    </div>

                    {previousSalaries.length > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Last Payment</span>
                        <span className="stat-value">
                          {formatCurrency(previousSalaries[0].amount)} (
                          {formatDate(previousSalaries[0].datePaid)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Type Toggle */}
            <div className="form-group payment-type-group">
              <label>
                <i className="bi bi-credit-card"></i> Payment Type
              </label>
              <div className="payment-type-toggle">
                <input
                  type="radio"
                  id="salary"
                  name="paymentType"
                  value="salary"
                  checked={formData.paymentType === "salary"}
                  onChange={handleInputChange}
                  className="payment-type-input"
                />
                <label htmlFor="salary" className="payment-type-label">
                  <i className="bi bi-calendar-month"></i>
                  <span>Monthly Salary</span>
                </label>

                <input
                  type="radio"
                  id="daily_credit"
                  name="paymentType"
                  value="daily_credit"
                  checked={formData.paymentType === "daily_credit"}
                  onChange={handleInputChange}
                  className="payment-type-input"
                />
                <label htmlFor="daily_credit" className="payment-type-label">
                  <i className="bi bi-calendar-day"></i>
                  <span>Daily Credit</span>
                </label>
              </div>
            </div>

            <div className="form-row">
              {/* Payment Amount */}
              <div
                className={`form-group ${
                  validationErrors.amount ? "has-error" : ""
                }`}
              >
                <label htmlFor="amount">
                  <i className="bi bi-cash"></i> Payment Amount
                </label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    className={`form-control ${
                      amountFocused ? "focused" : ""
                    } ${animateAmount ? "pulse-animation" : ""}`}
                    value={formData.amount || ""}
                    onChange={handleInputChange}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    ref={amountInputRef}
                  />
                </div>

                {/* Suggested Amount Bubble */}
                {showSuggestedAmount && amountSuggestion !== null && (
                  <div
                    className="suggested-amount-bubble"
                    ref={suggestedAmountRef}
                  >
                    <div className="suggested-amount-content">
                      <span>Suggested: {formatCurrency(amountSuggestion)}</span>
                      <button
                        type="button"
                        className="apply-suggestion-btn"
                        onClick={applySuggestedAmount}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {validationErrors.amount && (
                  <div className="error-text">{validationErrors.amount}</div>
                )}

                {formData.amount > 0 && (
                  <div className="amount-preview">
                    {formatCurrency(formData.amount)}
                  </div>
                )}
              </div>

              {/* Payment Date */}
              <div
                className={`form-group ${
                  validationErrors.datePaid ? "has-error" : ""
                }`}
              >
                <label htmlFor="datePaid">
                  <i className="bi bi-calendar"></i> Payment Date
                </label>
                <input
                  type="date"
                  id="datePaid"
                  name="datePaid"
                  className="form-control"
                  value={formData.datePaid}
                  onChange={handleInputChange}
                  max={today}
                />
                {validationErrors.datePaid && (
                  <div className="error-text">{validationErrors.datePaid}</div>
                )}
              </div>
            </div>

            {/* Last Salary Date (only for monthly salary) */}
            {formData.paymentType === "salary" && (
              <div
                className={`form-group ${
                  validationErrors.lastSalaryDate ? "has-error" : ""
                }`}
              >
                <label htmlFor="lastSalaryDate">
                  <i className="bi bi-calendar-check"></i> Last Salary Date
                </label>
                <input
                  type="date"
                  id="lastSalaryDate"
                  name="lastSalaryDate"
                  className="form-control"
                  value={formData.lastSalaryDate}
                  onChange={handleInputChange}
                  max={formData.datePaid}
                />
                {validationErrors.lastSalaryDate && (
                  <div className="error-text">
                    {validationErrors.lastSalaryDate}
                  </div>
                )}
                <div className="help-text">
                  Date of the previous salary payment period (required for
                  monthly salary)
                </div>
              </div>
            )}

            {/* Payment Summary Card */}
            {selectedEmployee && formData.amount > 0 && (
              <div className="payment-summary-card">
                <h3 className="summary-title">
                  <i className="bi bi-card-checklist"></i> Payment Summary
                </h3>

                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Employee</span>
                    <span className="summary-value">
                      {selectedEmployee.name}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">Payment Type</span>
                    <span className="summary-value">
                      {getPaymentTypeLabel(formData.paymentType)}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">Amount</span>
                    <span className="summary-value amount">
                      {formatCurrency(formData.amount)}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">Payment Date</span>
                    <span className="summary-value">
                      {formatDate(formData.datePaid)}
                    </span>
                  </div>

                  {formData.paymentType === "salary" &&
                    formData.lastSalaryDate && (
                      <div className="summary-row">
                        <span className="summary-label">Last Salary Date</span>
                        <span className="summary-value">
                          {formatDate(formData.lastSalaryDate)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <div className="btn-loading-indicator">
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <i
                      className={`bi ${salary ? "bi-check-circle" : "bi-save"}`}
                    ></i>
                    {salary ? "Update Payment" : "Record Payment"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalaryForm;
