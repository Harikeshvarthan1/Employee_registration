import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type{ Employee } from "../../models/types";
import { addEmployee, updateEmployee } from "../../apis/employeeApi";
import "./EmployeeForm.css";

interface EmployeeFormProps {
  employee?: Employee; // For edit mode
  onSuccess?: (employee: Employee) => void;
  onCancel?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSuccess,
  onCancel,
}) => {
  // Initialize form data
  const [formData, setFormData] = useState<Employee>({
    name: "",
    phoneNo: "",
    address: "",
    role: "",
    joinDate: new Date().toISOString().split("T")[0],
    baseSalary: 0,
    status: "active",
  });

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"add" | "edit">(
    employee ? "edit" : "add"
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Date constraints
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");

  const navigate = useNavigate();

  // Initialize component with employee data for edit mode
  useEffect(() => {
    // Set date constraints
    const today = new Date().toISOString().split("T")[0];
    setMaxDate(today);

    // Set min date to 50 years ago
    const fiftyYearsAgo = new Date();
    fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
    setMinDate(fiftyYearsAgo.toISOString().split("T")[0]);

    // If employee data is provided, populate the form (edit mode)
    if (employee) {
      setCurrentView("edit");

      // Format the date if it's a Date object
      const formattedJoinDate =
        employee.joinDate instanceof Date
          ? employee.joinDate.toISOString().split("T")[0]
          : typeof employee.joinDate === "string"
          ? new Date(employee.joinDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

      setFormData({
        ...employee,
        joinDate: formattedJoinDate,
      });
    } else {
      // Default values for add mode
      setFormData({
        name: "",
        phoneNo: "",
        address: "",
        role: "",
        joinDate: today,
        baseSalary: 0,
        status: "active",
      });
    }
  }, [employee]);

  // Validate the form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Employee name is required";
    }

    if (!formData.phoneNo.trim()) {
      errors.phoneNo = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNo)) {
      errors.phoneNo = "Phone number must be 10 digits";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.role.trim()) {
      errors.role = "Role is required";
    }

    if (!formData.joinDate) {
      errors.joinDate = "Join date is required";
    }

    if (formData.baseSalary <= 0) {
      errors.baseSalary = "Base salary must be greater than 0";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number | Date = value;

    // Convert number inputs
    if (type === "number") {
      parsedValue = parseFloat(value || "0");
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    });

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: "",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "Not specified";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;

      // Format data for API
      const employeeData: Employee = {
        ...formData,
        joinDate: new Date(formData.joinDate),
      };

      if (currentView === "edit" && employee?.id) {
        // Update existing employee
        result = await updateEmployee({
          ...employeeData,
          id: employee.id,
        });
        console.log("Employee updated successfully:", result);
      } else {
        // Add new employee
        result = await addEmployee(employeeData);
        console.log("Employee added successfully:", result);
      }

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        if (onSuccess) {
          onSuccess(result);
        }
      }, 2000);
    } catch (err: any) {
      console.error("Error saving employee:", err);
      setError(err.message || "An error occurred while saving the employee");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel form and go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Format currency for display - Updated to use INR
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };


  // Common roles for suggestions
  const commonRoles = [
    "Manager",
    "Developer",
    "Designer",
    "Accountant",
    "HR Specialist",
    "Sales Representative",
    "Analyst",
    "Project Manager",
    "Technician",
    "Administrator",
  ];

  return (
    <div className="employee-form-container">
      {/* Error display */}
      {error && (
        <div className="error-message">
          <i className="bi bi-exclamation-triangle"></i>
          <span>{error}</span>
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={() => setError(null)}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Form card */}
      <div className="employee-form-card">
        <div className="card-header">
          <h3>
            <i className="bi bi-person-plus"></i>
            {currentView === "add" ? "Add New Employee" : "Edit Employee"}
          </h3>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Two column layout for form fields */}
            <div className="form-columns">
              {/* Left column */}
              <div className="form-column">
                {/* Employee name field */}
                <div
                  className={`form-group ${
                    validationErrors.name ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="name" className="form-label">
                    <i className="bi bi-person"></i> Employee Name{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter employee full name"
                    required
                  />
                  {validationErrors.name && (
                    <div className="error-text">{validationErrors.name}</div>
                  )}
                </div>

                {/* Phone number field */}
                <div
                  className={`form-group ${
                    validationErrors.phoneNo ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="phoneNo" className="form-label">
                    <i className="bi bi-telephone"></i> Phone Number{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNo"
                    name="phoneNo"
                    className="form-control"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                  {validationErrors.phoneNo && (
                    <div className="error-text">{validationErrors.phoneNo}</div>
                  )}
                  <div className="help-text">
                    Format: 1234567890 (10 digits)
                  </div>
                </div>

                {/* Role field - manual input like room number */}
                <div
                  className={`form-group ${
                    validationErrors.role ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="role" className="form-label">
                    <i className="bi bi-briefcase"></i> Job Role{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={handleInputChange}
                    list="role-suggestions"
                    placeholder="Enter job role (e.g. Manager, Developer)"
                    required
                  />
                  <datalist id="role-suggestions">
                    {commonRoles.map((role, index) => (
                      <option key={index} value={role} />
                    ))}
                  </datalist>
                  {validationErrors.role && (
                    <div className="error-text">{validationErrors.role}</div>
                  )}
                </div>

                {/* Base salary field */}
                <div
                  className={`form-group ${
                    validationErrors.baseSalary ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="baseSalary" className="form-label">
                    <i className="bi bi-cash"></i> Base Salary{" "}
                    <span className="required">*</span>
                  </label>
                  <div className="salary-input">
                    <div className="currency-indicator">₹</div>
                    <input
                      type="number"
                      id="baseSalary"
                      name="baseSalary"
                      className="form-control"
                      value={formData.baseSalary}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {formData.baseSalary > 0 && (
                    <div className="salary-preview">
                      {formatCurrency(formData.baseSalary)} per month
                    </div>
                  )}
                  {validationErrors.baseSalary && (
                    <div className="error-text">
                      {validationErrors.baseSalary}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="form-column">
                {/* Address field */}
                <div
                  className={`form-group ${
                    validationErrors.address ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="address" className="form-label">
                    <i className="bi bi-geo-alt"></i> Address{" "}
                    <span className="required">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    className="form-control"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter employee's address"
                    required
                  ></textarea>
                  {validationErrors.address && (
                    <div className="error-text">{validationErrors.address}</div>
                  )}
                </div>

                {/* Join date field */}
                <div
                  className={`form-group ${
                    validationErrors.joinDate ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="joinDate" className="form-label">
                    <i className="bi bi-calendar"></i> Join Date{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="joinDate"
                    name="joinDate"
                    className="form-control"
                    value={
                      typeof formData.joinDate === "string"
                        ? formData.joinDate
                        : formData.joinDate.toISOString().split("T")[0]
                    }
                    onChange={handleInputChange}
                    min={minDate}
                    max={maxDate}
                    required
                  />
                  {validationErrors.joinDate && (
                    <div className="error-text">
                      {validationErrors.joinDate}
                    </div>
                  )}
                  <div className="help-text">
                    Date when employee joined the company
                  </div>
                </div>

                {/* Status field */}
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-toggle-on"></i> Status
                  </label>
                  <div className="status-toggle">
                    <div className="toggle-label">Inactive</div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.status === "active"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.checked ? "active" : "inactive",
                          })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label">Active</div>
                  </div>
                </div>

                {/* Employee preview card */}
                <div className="employee-preview-card">
                  <h4 className="preview-title">Employee Preview</h4>
                  <div className="preview-content">
                    <div className="avatar-placeholder">
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <div className="preview-details">
                      <div className="preview-name">
                        {formData.name || "Employee Name"}
                      </div>
                      <div className="preview-role">
                        {formData.role || "Job Role"}
                      </div>
                      <div className="preview-info">
                        <div className="info-item">
                          <i className="bi bi-telephone"></i>
                          <span>{formData.phoneNo || "Phone Number"}</span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-calendar-check"></i>
                          <span>
                            Joined:{" "}
                            {formData.joinDate
                              ? formatDate(formData.joinDate)
                              : "Join Date"}
                          </span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-cash-stack"></i>
                          <span>
                            Salary:{" "}
                            {formData.baseSalary > 0
                              ? formatCurrency(formData.baseSalary)
                              : "Base Salary"}
                          </span>
                        </div>
                        <div className="info-item">
                          <i
                            className={`bi ${
                              formData.status === "active"
                                ? "bi-check-circle-fill text-success"
                                : "bi-x-circle-fill text-danger"
                            }`}
                          ></i>
                          <span>
                            Status:{" "}
                            <strong>
                              {formData.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form action buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
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
                    <i
                      className={`bi ${
                        currentView === "add"
                          ? "bi-person-plus"
                          : "bi-check-circle"
                      }`}
                    ></i>
                    {currentView === "add" ? "Add Employee" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success toast notification */}
      {showSuccessToast && (
        <div className="toast-container">
          <div className="toast-notification success">
            <div className="toast-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="toast-content">
              <div className="toast-title">Success</div>
              <div className="toast-message">
                {currentView === "add"
                  ? "Employee added successfully!"
                  : "Employee updated successfully!"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeForm;