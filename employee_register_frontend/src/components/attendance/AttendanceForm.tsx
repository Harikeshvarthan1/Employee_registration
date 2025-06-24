// src/components/attendance/AttendanceForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  addAttendance, 
  checkAttendanceExists, 
  formatDateForApi 
} from '../../apis/attendanceApi';
import { getAllActiveEmployees } from '../../apis/employeeApi';
import type{ Employee, AttendanceFormData } from '../../models/types';
import { formatDate } from '../../utils/dateUtils';
import './AttendanceForm.css';

interface AttendanceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialDate?: string;
  employeeId?: number;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  onSuccess,
  onCancel,
  initialDate,
  employeeId: initialEmployeeId
}) => {
  // Form data state with properly typed status
  const [formData, setFormData] = useState<AttendanceFormData>({
    employeeId: initialEmployeeId || 0,
    date: initialDate || formatDateForApi(new Date()),
    status: 'present', // One of the allowed values
    description: '',
  });

  // Form utilities and UI states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [animateStatus, setAnimateStatus] = useState<boolean>(false);

  // References
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const statusContainerRef = useRef<HTMLDivElement>(null);

  // Load active employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const activeEmployees = await getAllActiveEmployees();
        setEmployees(activeEmployees);
        
        // Set the selected employee if initialEmployeeId is provided
        if (initialEmployeeId) {
          const employee = activeEmployees.find(emp => emp.id === initialEmployeeId);
          if (employee) {
            setSelectedEmployee(employee);
          }
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [initialEmployeeId]);

  // Check if attendance record already exists when employee or date changes
  useEffect(() => {
    const checkExistingAttendance = async () => {
      if (formData.employeeId && formData.date) {
        try {
          const exists = await checkAttendanceExists(formData.employeeId, formData.date);
          setExistingRecord(exists);
          if (exists) {
            setErrors({
              ...errors,
              general: `Attendance record already exists for this employee on ${formatDate(formData.date)}`
            });
          } else {
            const newErrors = { ...errors };
            delete newErrors.general;
            setErrors(newErrors);
          }
        } catch (error) {
          console.error('Error checking existing attendance:', error);
        }
      }
    };

    checkExistingAttendance();
  }, [formData.employeeId, formData.date]);

  // Animate status change
  useEffect(() => {
    if (animateStatus) {
      const timer = setTimeout(() => {
        setAnimateStatus(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animateStatus]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For employee selection, update selected employee
    if (name === 'employeeId') {
      const employeeId = parseInt(value, 10);
      const employee = employees.find(emp => emp.id === employeeId);
      setSelectedEmployee(employee || null);
      
      setFormData(prev => ({
        ...prev,
        [name]: employeeId
      }));
    } 
    // For status selection, ensure it's one of the allowed values
    else if (name === 'status') {
      // Type assertion to ensure value is one of the allowed status values
      const statusValue = value as 'present' | 'absent' | 'overtime' | 'halfday';
      
      setAnimateStatus(true);
      setFormData(prev => ({
        ...prev,
        status: statusValue,
        // Clear overtime fields if status is not overtime
        ...(statusValue !== 'overtime' ? { overtimeDescription: '', overtimeSalary: undefined } : {})
      }));
    } 
    // For overtime salary, parse as number
    else if (name === 'overtimeSalary') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : undefined
      }));
    }
    // For all other fields
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear field-specific error
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  // Validate the form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData.status) {
      newErrors.status = 'Please select an attendance status';
    }

    if (formData.status === 'overtime') {
      if (!formData.overtimeDescription?.trim()) {
        newErrors.overtimeDescription = 'Please provide details about the overtime work';
      }

      if (!formData.overtimeSalary || formData.overtimeSalary <= 0) {
        newErrors.overtimeSalary = 'Please enter a valid overtime salary amount';
      }
    }

    if (existingRecord) {
      newErrors.general = `Attendance record already exists for this employee on ${formatDate(formData.date)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Smooth scroll to the first error
      const firstErrorEl = document.querySelector('.error-text');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (existingRecord) {
      setShowConfirmModal(true);
      return;
    }

    await submitAttendance();
  };

  // Submit attendance data to API
  const submitAttendance = async () => {
    setLoading(true);
    try {
      await addAttendance(formData);
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/attendance');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      setErrors({
        ...errors,
        general: error.message || 'Failed to save attendance record'
      });
      setLoading(false);
    }
  };

  // Cancel form and go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/attendance');
    }
  };

  // Get the current date (for max date constraint)
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Generate classes for status options
  const getStatusClasses = (status: 'present' | 'absent' | 'overtime' | 'halfday') => {
    return `status-option ${formData.status === status ? 'active' : ''} ${animateStatus && formData.status === status ? 'animate' : ''}`;
  };

  return (
    <div className="attendance-form-container">
      {/* Success overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark draw"></div>
            </div>
            <h3>Attendance Recorded!</h3>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="attendance-form-card">
        <div className="card-header">
          <h2>
            <i className="bi bi-calendar-check"></i> Record Attendance
          </h2>
          <p className="header-subtitle">Track employee attendance and work hours</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="card-body">
            {/* General error message */}
            {errors.general && (
              <div className="error-banner">
                <i className="bi bi-exclamation-triangle"></i>
                <span>{errors.general}</span>
                <button 
                  type="button" 
                  className="close-error" 
                  onClick={() => setErrors({ ...errors, general: '' })}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {/* Employee selection */}
            <div className={`form-group ${errors.employeeId ? 'has-error' : ''}`}>
              <label htmlFor="employeeId">
                <i className="bi bi-person"></i> Select Employee <span className="required">*</span>
              </label>
              
              {loadingEmployees ? (
                <div className="employee-loading">
                  <div className="spinner"></div>
                  <span>Loading employees...</span>
                </div>
              ) : (
                <>
                  <div className="employee-select-wrapper">
                    <select
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId || ''}
                      onChange={handleInputChange}
                      className={selectedEmployee ? 'has-value' : ''}
                      required
                    >
                      <option value="">-- Select an employee --</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.role})
                        </option>
                      ))}
                    </select>
                    <i className="bi bi-chevron-down"></i>
                  </div>
                  
                  {selectedEmployee && (
                    <div className="selected-employee-card">
                      <div className="employee-avatar">
                        <div className="avatar-text">
                          {selectedEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="employee-info">
                        <div className="employee-name">{selectedEmployee.name}</div>
                        <div className="employee-role">{selectedEmployee.role}</div>
                      </div>
                    </div>
                  )}
                  
                  {errors.employeeId && <div className="error-text">{errors.employeeId}</div>}
                  {employees.length === 0 && (
                    <div className="no-employees-warning">
                      <i className="bi bi-exclamation-circle"></i>
                      <span>No active employees found in the system</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Date selection */}
            <div className={`form-group ${errors.date ? 'has-error' : ''}`}>
              <label htmlFor="date">
                <i className="bi bi-calendar"></i> Attendance Date <span className="required">*</span>
              </label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={getCurrentDate()}
                  required
                />
                <i className="bi bi-calendar-date"></i>
              </div>
              {errors.date && <div className="error-text">{errors.date}</div>}
              <div className="form-hint">Select the date for recording attendance</div>
            </div>

            {/* Status selection */}
            <div className={`form-group ${errors.status ? 'has-error' : ''}`}>
              <label>
                <i className="bi bi-check-circle"></i> Attendance Status <span className="required">*</span>
              </label>
              
              <div className="status-options-container" ref={statusContainerRef}>
                <div className={getStatusClasses('present')}>
                  <input
                    type="radio"
                    id="present"
                    name="status"
                    value="present"
                    checked={formData.status === 'present'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="present">
                    <div className="status-icon">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <span>Present</span>
                  </label>
                </div>

                <div className={getStatusClasses('absent')}>
                  <input
                    type="radio"
                    id="absent"
                    name="status"
                    value="absent"
                    checked={formData.status === 'absent'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="absent">
                    <div className="status-icon">
                      <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <span>Absent</span>
                  </label>
                </div>

                <div className={getStatusClasses('halfday')}>
                  <input
                    type="radio"
                    id="halfday"
                    name="status"
                    value="halfday"
                    checked={formData.status === 'halfday'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="halfday">
                    <div className="status-icon">
                      <i className="bi bi-circle-half"></i>
                    </div>
                    <span>Half Day</span>
                  </label>
                </div>

                <div className={getStatusClasses('overtime')}>
                  <input
                    type="radio"
                    id="overtime"
                    name="status"
                    value="overtime"
                    checked={formData.status === 'overtime'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="overtime">
                    <div className="status-icon">
                      <i className="bi bi-alarm-fill"></i>
                    </div>
                    <span>Overtime</span>
                  </label>
                </div>
              </div>
              
              {errors.status && <div className="error-text">{errors.status}</div>}
            </div>

            {/* Conditional overtime fields */}
            {formData.status === 'overtime' && (
              <div className="overtime-section">
                <div className={`form-group ${errors.overtimeDescription ? 'has-error' : ''}`}>
                  <label htmlFor="overtimeDescription">
                    <i className="bi bi-card-text"></i> Overtime Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="overtimeDescription"
                    name="overtimeDescription"
                    value={formData.overtimeDescription || ''}
                    onChange={handleInputChange}
                    placeholder="Describe the overtime work performed"
                    rows={3}
                  />
                  {errors.overtimeDescription && (
                    <div className="error-text">{errors.overtimeDescription}</div>
                  )}
                </div>

                <div className={`form-group ${errors.overtimeSalary ? 'has-error' : ''}`}>
                  <label htmlFor="overtimeSalary">
                    <i className="bi bi-cash"></i> Overtime Salary <span className="required">*</span>
                  </label>
                  <div className="salary-input">
                    <div className="currency-symbol">$</div>
                    <input
                      type="number"
                      id="overtimeSalary"
                      name="overtimeSalary"
                      value={formData.overtimeSalary || ''}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {errors.overtimeSalary && (
                    <div className="error-text">{errors.overtimeSalary}</div>
                  )}
                </div>
              </div>
            )}

            {/* Additional description */}
            <div className="form-group">
              <label htmlFor="description">
                <i className="bi bi-card-text"></i> Additional Notes
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Any additional comments or notes about the attendance"
                rows={4}
              />
            </div>

            {/* Status preview */}
            <div className="status-preview">
              <div className={`preview-badge ${formData.status}`}>
                {formData.status === 'present' && <><i className="bi bi-check-circle-fill"></i> Present</>}
                {formData.status === 'absent' && <><i className="bi bi-x-circle-fill"></i> Absent</>}
                {formData.status === 'halfday' && <><i className="bi bi-circle-half"></i> Half Day</>}
                {formData.status === 'overtime' && <><i className="bi bi-alarm-fill"></i> Overtime</>}
              </div>
              
              <div className="preview-details">
                {selectedEmployee ? (
                  <span className="preview-employee">{selectedEmployee.name}</span>
                ) : (
                  <span className="preview-placeholder">Select an employee</span>
                )}
                <span className="preview-date">
                  {formData.date ? formatDate(formData.date) : 'Select a date'}
                </span>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="card-footer">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || existingRecord || loadingEmployees || employees.length === 0}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Record Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm modal for overwriting existing record */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Existing Record</h3>
              <button 
                type="button" 
                className="close-modal"
                onClick={() => setShowConfirmModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>An attendance record already exists for this employee on this date.</p>
              <p className="warning-text">Do you want to overwrite the existing record?</p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowConfirmModal(false)}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={async () => {
                  setShowConfirmModal(false);
                  await submitAttendance();
                }}
              >
                <i className="bi bi-check-circle"></i> Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceForm;