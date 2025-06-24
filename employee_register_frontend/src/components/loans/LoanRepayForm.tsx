import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LoanRepay, LoanRegistration, Employee } from "../../models/types";
import { addRepayment } from "../../apis/loanRepayApi";
import {
  getActiveLoansByEmployeeId,
  getLoanById,
} from "../../apis/loanRegistrationApi";
import { getAllActiveEmployees } from "../../apis/employeeApi";
import { getTotalRepaidForLoan } from "../../apis/loanRepayApi";
import "./LoanRepayForm.css";

interface LoanRepayFormProps {
  onSuccess?: (repayment: LoanRepay) => void;
  onCancel?: () => void;
  preselectedLoanId?: number;
  preselectedEmployeeId?: number;
}

const LoanRepayForm: React.FC<LoanRepayFormProps> = ({
  onSuccess,
  onCancel,
  preselectedLoanId,
  preselectedEmployeeId,
}) => {
  // Form state
  const [formData, setFormData] = useState<{
    loanId: number | "";
    employeeId: number | "";
    repayAmount: number;
    repayDate: string;
  }>({
    loanId: preselectedLoanId || "",
    employeeId: preselectedEmployeeId || "",
    repayAmount: 0,
    repayDate: new Date().toISOString().split("T")[0],
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

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableLoans, setAvailableLoans] = useState<LoanRegistration[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanRegistration | null>(
    null
  );
  const [totalRepaid, setTotalRepaid] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);

  const navigate = useNavigate();

  // Load employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeData = await getAllActiveEmployees();
        setEmployees(employeeData);

        // If employee is preselected, load their loans
        if (preselectedEmployeeId) {
          loadLoansForEmployee(preselectedEmployeeId);
        }
      } catch (err: any) {
        console.error("Error loading employees:", err);
        setError("Failed to load employees. Please try again.");
      }
    };

    loadEmployees();
  }, [preselectedEmployeeId]);

  // Load loans for selected employee
  const loadLoansForEmployee = useCallback(
    async (employeeId: number) => {
      if (!employeeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const loans = await getActiveLoansByEmployeeId(employeeId);
        setAvailableLoans(loans);

        // If we have a preselected loan and it's in the available loans, select it
        if (preselectedLoanId) {
          const preselectedLoan = loans.find(
            (loan) => loan.loanId === preselectedLoanId
          );
          if (preselectedLoan) {
            setSelectedLoan(preselectedLoan);
            calculateRemainingAmount(
              preselectedLoanId,
              preselectedLoan.loanAmount
            );
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading loans:", err);
        setError("Failed to load loans for the selected employee.");
        setIsLoading(false);
      }
    },
    [preselectedLoanId]
  );

  // When employee changes, load their loans
  useEffect(() => {
    if (formData.employeeId) {
      loadLoansForEmployee(Number(formData.employeeId));
    } else {
      setAvailableLoans([]);
      setSelectedLoan(null);
    }
  }, [formData.employeeId, loadLoansForEmployee]);

  // Calculate remaining amount for selected loan
  const calculateRemainingAmount = async (
    loanId: number,
    totalAmount: number
  ) => {
    try {
      const repaid = await getTotalRepaidForLoan(loanId);
      setTotalRepaid(repaid);
      const remaining = totalAmount - repaid;
      setRemainingAmount(remaining);

      // If repay amount exceeds remaining, adjust it
      if (formData.repayAmount > remaining) {
        setFormData((prev) => ({
          ...prev,
          repayAmount: remaining,
        }));
      }
    } catch (err) {
      console.error("Error calculating remaining amount:", err);
    }
  };

  // When loan changes, load details and calculate remaining amount
  useEffect(() => {
    const loadLoanDetails = async () => {
      if (!formData.loanId) {
        setSelectedLoan(null);
        setRemainingAmount(0);
        setTotalRepaid(0);
        return;
      }

      try {
        const loanId = Number(formData.loanId);
        // First try to find in available loans
        let loanDetails = availableLoans.find((loan) => loan.loanId === loanId);

        // If not found, fetch from API
        if (!loanDetails) {
          loanDetails = await getLoanById(loanId);
        }

        setSelectedLoan(loanDetails);

        if (loanDetails) {
          calculateRemainingAmount(loanId, loanDetails.loanAmount);
        }
      } catch (err) {
        console.error("Error loading loan details:", err);
      }
    };

    loadLoanDetails();
  }, [formData.loanId, availableLoans]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number = value;

    // Parse number inputs
    if (type === "number") {
      parsedValue = value === "" ? 0 : Number(value);

      // Don't allow repayment more than remaining amount
      if (name === "repayAmount" && selectedLoan) {
        const numValue = Number(value);
        if (numValue > remainingAmount) {
          parsedValue = remainingAmount;
        }
      }
    }

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

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.employeeId) {
      errors.employeeId = "Please select an employee";
    }

    if (!formData.loanId) {
      errors.loanId = "Please select a loan to repay";
    }

    if (!formData.repayAmount || formData.repayAmount <= 0) {
      errors.repayAmount = "Please enter a valid repayment amount";
    } else if (formData.repayAmount > remainingAmount) {
      errors.repayAmount = `Repayment cannot exceed remaining amount of ${formatCurrency(
        remainingAmount
      )}`;
    }

    if (!formData.repayDate) {
      errors.repayDate = "Please select a repayment date";
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
      const repaymentData = {
        loanId: Number(formData.loanId),
        employeeId: Number(formData.employeeId),
        repayAmount: Number(formData.repayAmount),
        repayDate: formData.repayDate,
      };

      const result = await addRepayment(repaymentData);

      // Show success animation
      setShowSuccessAnimation(true);

      // Wait for animation to complete
      setTimeout(() => {
        setShowSuccessAnimation(false);
        if (onSuccess) {
          onSuccess(result);
        } else {
          // Reset form for another entry
          setFormData({
            loanId: "",
            employeeId: formData.employeeId, // Keep the same employee for convenience
            repayAmount: 0,
            repayDate: new Date().toISOString().split("T")[0],
          });

          // If we kept the same employee, reload their loans to reflect the new repayment
          if (formData.employeeId) {
            loadLoansForEmployee(Number(formData.employeeId));
          }
        }
      }, 2000);
    } catch (err: any) {
      console.error("Error adding repayment:", err);
      setError(
        err.message || "Failed to process loan repayment. Please try again."
      );
    } finally {
      setIsSaving(false);
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
  

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate repayment progress percentage
  const calculateProgressPercentage = (): number => {
    if (!selectedLoan) return 0;

    const total = selectedLoan.loanAmount;
    const percentage = (totalRepaid / total) * 100;
    return Math.min(percentage, 100); // Ensure it never exceeds 100%
  };

  // Handle cancel button
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Get today's date for max date input
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="loan-repay-form-container">
      {/* Success animation overlay */}
      {showSuccessAnimation && (
        <div className="success-animation-overlay">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark draw"></div>
            </div>
            <h3>Payment Recorded!</h3>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          <i className="bi bi-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      <div className="loan-repay-card">
        <div className="card-header">
          <h2>
            <i className="bi bi-credit-card"></i> Record Loan Repayment
          </h2>
          <p className="subtitle">Make a payment towards an existing loan</p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {/* Employee selection */}
              <div
                className={`form-group ${
                  validationErrors.employeeId ? "has-error" : ""
                }`}
              >
                <label htmlFor="employeeId">
                  <i className="bi bi-person"></i> Select Employee
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  disabled={isLoading || !!preselectedEmployeeId}
                  className="form-control"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                {validationErrors.employeeId && (
                  <div className="error-text">
                    {validationErrors.employeeId}
                  </div>
                )}
              </div>

              {/* Loan selection */}
              <div
                className={`form-group ${
                  validationErrors.loanId ? "has-error" : ""
                }`}
              >
                <label htmlFor="loanId">
                  <i className="bi bi-cash-coin"></i> Select Active Loan
                </label>
                <select
                  id="loanId"
                  name="loanId"
                  value={formData.loanId}
                  onChange={handleInputChange}
                  disabled={
                    isLoading || !formData.employeeId || !!preselectedLoanId
                  }
                  className="form-control"
                >
                  <option value="">-- Select Loan --</option>
                  {availableLoans.map((loan) => (
                    <option key={loan.loanId} value={loan.loanId}>
                      {formatCurrency(loan.loanAmount)} - {loan.reason}
                    </option>
                  ))}
                </select>
                {validationErrors.loanId && (
                  <div className="error-text">{validationErrors.loanId}</div>
                )}
                {formData.employeeId &&
                  availableLoans.length === 0 &&
                  !isLoading && (
                    <div className="info-text">
                      No active loans found for this employee
                    </div>
                  )}
              </div>
            </div>

            {/* Loan details card shown when a loan is selected */}
            {selectedLoan && (
              <div className="loan-details-card">
                <div className="loan-details-header">
                  <h3>Loan Details</h3>
                  <span className="loan-date">
                    Issued: {formatDate(selectedLoan.loanDate)}
                  </span>
                </div>

                <div className="loan-amount-section">
                  <div className="loan-amount-box">
                    <span className="amount-label">Original Amount</span>
                    <span className="amount-value">
                      {formatCurrency(selectedLoan.loanAmount)}
                    </span>
                  </div>
                  <div className="loan-amount-box">
                    <span className="amount-label">Total Repaid</span>
                    <span className="amount-value">
                      {formatCurrency(totalRepaid)}
                    </span>
                  </div>
                  <div className="loan-amount-box remaining">
                    <span className="amount-label">Remaining Balance</span>
                    <span className="amount-value">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                <div className="loan-progress">
                  <div className="progress-label">
                    <span>Repayment Progress</span>
                    <span>{Math.round(calculateProgressPercentage())}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${calculateProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="loan-reason">
                  <span className="reason-label">Purpose:</span>
                  <span className="reason-text">{selectedLoan.reason}</span>
                </div>
              </div>
            )}

            <div className="form-row">
              {/* Repayment amount */}
              <div
                className={`form-group ${
                  validationErrors.repayAmount ? "has-error" : ""
                }`}
              >
                <label htmlFor="repayAmount">
                  <i className="bi bi-currency-dollar"></i> Repayment Amount
                </label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    id="repayAmount"
                    name="repayAmount"
                    value={formData.repayAmount || ""}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={remainingAmount}
                    className="form-control"
                    disabled={!formData.loanId || isLoading}
                  />

                  {selectedLoan && (
                    <button
                      type="button"
                      className="full-amount-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          repayAmount: remainingAmount,
                        }))
                      }
                      disabled={!formData.loanId || isLoading}
                    >
                      Pay Full
                    </button>
                  )}
                </div>
                {validationErrors.repayAmount && (
                  <div className="error-text">
                    {validationErrors.repayAmount}
                  </div>
                )}
              </div>

              {/* Repayment date */}
              <div
                className={`form-group ${
                  validationErrors.repayDate ? "has-error" : ""
                }`}
              >
                <label htmlFor="repayDate">
                  <i className="bi bi-calendar"></i> Repayment Date
                </label>
                <input
                  type="date"
                  id="repayDate"
                  name="repayDate"
                  value={formData.repayDate}
                  onChange={handleInputChange}
                  className="form-control"
                  max={today}
                  disabled={isLoading}
                />
                {validationErrors.repayDate && (
                  <div className="error-text">{validationErrors.repayDate}</div>
                )}
              </div>
            </div>

            {/* Repayment impact section */}
            {selectedLoan && formData.repayAmount > 0 && (
              <div className="repayment-impact">
                <h4>Repayment Impact</h4>
                <div className="impact-row">
                  <div className="impact-item">
                    <span className="impact-label">Current Balance</span>
                    <span className="impact-value">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">After Repayment</span>
                    <span className="impact-value">
                      {formatCurrency(
                        Math.max(
                          0,
                          remainingAmount - Number(formData.repayAmount)
                        )
                      )}
                    </span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Status After</span>
                    <span
                      className={`impact-value ${
                        remainingAmount - Number(formData.repayAmount) <= 0
                          ? "full-paid"
                          : ""
                      }`}
                    >
                      {remainingAmount - Number(formData.repayAmount) <= 0
                        ? "Fully Paid"
                        : "Active"}
                    </span>
                  </div>
                </div>
                <div className="new-progress-preview">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar current"
                      style={{ width: `${calculateProgressPercentage()}%` }}
                    ></div>
                    <div
                      className="progress-bar new"
                      style={{
                        width: `${
                          Math.min(
                            100,
                            ((totalRepaid + Number(formData.repayAmount)) /
                              selectedLoan.loanAmount) *
                              100
                          ) - calculateProgressPercentage()
                        }%`,
                        left: `${calculateProgressPercentage()}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Form actions */}
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
                disabled={
                  isSaving ||
                  isLoading ||
                  !formData.loanId ||
                  formData.repayAmount <= 0
                }
              >
                {isSaving ? (
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
      </div>
    </div>
  );
};

export default LoanRepayForm;