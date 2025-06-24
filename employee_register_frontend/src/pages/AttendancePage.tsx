import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllAttendance, 
  addAttendance, 
  updateAttendance,
  deleteAttendance // Import the delete function
} from '../apis/attendanceApi';
import { getAllActiveEmployees } from '../apis/employeeApi';
import type { Attendance, Employee } from '../models/types';
import { formatDate } from '../utils/dateUtils';

import './AttendancePage.css';

// Corrected month name utility function
const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

// NEW: Interface for employee attendance summary
interface EmployeeAttendanceSummary {
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  presentCount: number;
  absentCount: number;
  overtimeCount: number;
  halfdayCount: number;
  totalOvertimeHours: number;
  totalRecords: number;
}

const AttendancePage: React.FC = () => {
  // Authentication and role check
  const { currentUser, isAdmin } = useAuth();
  
  // States for attendance data
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // Start with January
  const [selectedYear, setSelectedYear] = useState<number>(2024); // Start with a default year
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Triple tap functionality states
  const [, setTapCount] = useState<number>(0);
  const [showSecretMessage, setShowSecretMessage] = useState<boolean>(false);
  
  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
  
  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // NEW: Employee attendance summary states
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [selectedEmployeeSummary, setSelectedEmployeeSummary] = useState<EmployeeAttendanceSummary | null>(null);
  const [showEmployeeSummaryModal, setShowEmployeeSummaryModal] = useState<boolean>(false);
  
  // NEW: Summary modal month/year states
  const [summaryMonth, setSummaryMonth] = useState<number>(0); // Start with January
  const [summaryYear, setSummaryYear] = useState<number>(2024); // Start with a default year
  
  // Attendance form state - changing employeeId to number only (not null) and ADDING overtimeHours
  const [attendanceForm, setAttendanceForm] = useState<{
    employeeId: number;
    date: string;
    status: 'present' | 'absent' | 'overtime' | 'halfday';
    overtimeDescription: string;
    overtimeSalary: number;
    overtimeHours: number; // NEW: Added overtime hours field
    description: string;
  }>({
    employeeId: 0, // Default to 0 instead of null
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    overtimeDescription: '',
    overtimeSalary: 0,
    overtimeHours: 0, // NEW: Added overtime hours field
    description: ''
  });
  
  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfday: 0,
    overtime: 0,
    totalDays: 0
  });
  
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
  
  // Load data on component mount and check dark mode preference
  useEffect(() => {
    loadData();
    
    // Check dark mode preference
    const darkModePref = localStorage.getItem('ems-dark-mode');
    if (darkModePref === 'true') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
    
    return () => {
      // Clean up when component unmounts
      if (isDarkMode) {
        document.body.classList.remove('dark-mode');
      }
    };
  }, [currentUser]);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('ems-dark-mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('ems-dark-mode', 'false');
    }
  };
  
  // Load attendance data and employees
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all employees regardless of user role
      const employeesData = await getAllActiveEmployees();
      setEmployees(employeesData);
      
      // Set the default selected employee based on user role
      if (!isAdmin() && currentUser) {
        // In a real app, you'd set this to the current user's employee ID
        // For this example, we'll just select the first employee if available
        if (employeesData.length > 0 && employeesData[0].id) {
          setSelectedEmployee(employeesData[0].id);
          setAttendanceForm(prev => ({ ...prev, employeeId: employeesData[0].id || 0 }));
        }
      }
      
      // Load attendance records
      const attendanceData = await getAllAttendance();
      setAttendanceRecords(attendanceData);
      applyFilters(attendanceData);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load attendance data');
      // We don't set isLoading to false here, to keep showing the loading state
    }
  };

  // NEW: Function to calculate employee attendance summary for selected month/year
  const calculateEmployeeAttendanceSummary = (employeeId: number, month: number, year: number): EmployeeAttendanceSummary => {
    const employee = employees.find(emp => emp.id === employeeId);
    
    // Filter attendance records for the specific employee, month, and year
    const employeeAttendance = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return record.employeeId === employeeId &&
             recordDate.getMonth() === month &&
             recordDate.getFullYear() === year;
    });

    // Calculate counts
    const presentCount = employeeAttendance.filter(record => record.status === 'present').length;
    const absentCount = employeeAttendance.filter(record => record.status === 'absent').length;
    const overtimeCount = employeeAttendance.filter(record => record.status === 'overtime').length;
    const halfdayCount = employeeAttendance.filter(record => record.status === 'halfday').length;
    
    // Calculate total overtime hours (assuming overtimeHours field exists in the data)
    const totalOvertimeHours = employeeAttendance
      .filter(record => record.status === 'overtime')
      .reduce((total, record) => total + (record.overtimeHours || 0), 0);

    return {
      employeeId,
      employeeName: employee?.name || 'Unknown Employee',
      month,
      year,
      presentCount,
      absentCount,
      overtimeCount,
      halfdayCount,
      totalOvertimeHours,
      totalRecords: employeeAttendance.length
    };
  };

  // NEW: Function to show employee list modal
  const showEmployeeListModal = () => {
    setShowEmployeeModal(true);
  };

  // NEW: Function to handle employee selection and show summary
  const handleEmployeeSelection = (employeeId: number) => {
    const summary = calculateEmployeeAttendanceSummary(employeeId, summaryMonth, summaryYear);
    setSelectedEmployeeSummary(summary);
    setShowEmployeeModal(false);
    setShowEmployeeSummaryModal(true);
  };

  // NEW: Function to update summary when month/year changes
  const updateEmployeeSummary = () => {
    if (selectedEmployeeSummary) {
      const updatedSummary = calculateEmployeeAttendanceSummary(
        selectedEmployeeSummary.employeeId, 
        summaryMonth, 
        summaryYear
      );
      setSelectedEmployeeSummary(updatedSummary);
    }
  };

  // NEW: Effect to update summary when month/year changes
  useEffect(() => {
    updateEmployeeSummary();
  }, [summaryMonth, summaryYear, attendanceRecords]);
  
  // Apply filters to attendance records
  const applyFilters = useCallback((data: Attendance[] = attendanceRecords) => {
    let result = [...data];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(att => {
        const employee = employees.find(emp => emp.id === att.employeeId);
        return employee?.name.toLowerCase().includes(term) ||
               att.description?.toLowerCase().includes(term) ||
               att.overtimeDescription?.toLowerCase().includes(term);
      });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(att => att.status === statusFilter);
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999); // Include the end date fully
      
      result = result.filter(att => {
        const attDate = new Date(att.date);
        return attDate >= start && attDate <= end;
      });
    }
    
    // Filter by employee if one is selected
    if (selectedEmployee) {
      result = result.filter(att => att.employeeId === selectedEmployee);
    }
    
    // Calculate stats
    const newStats = {
      present: result.filter(att => att.status === 'present').length,
      absent: result.filter(att => att.status === 'absent').length,
      halfday: result.filter(att => att.status === 'halfday').length,
      overtime: result.filter(att => att.status === 'overtime').length,
      totalDays: result.length
    };
    
    setStats(newStats);
    setFilteredRecords(result);
  }, [attendanceRecords, searchTerm, statusFilter, dateRange, selectedEmployee, employees]);
  
  // Update filters when changes occur
  useEffect(() => {
    applyFilters();
  }, [applyFilters, searchTerm, statusFilter, dateRange, selectedEmployee]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle employeeId as a number
    if (name === 'employeeId') {
      setAttendanceForm(prev => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : 0 // Convert to number or use 0
      }));
    } else {
      setAttendanceForm(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
  };
  
  // Check if employee already has an attendance record for the selected date
  const checkExistingAttendance = (employeeId: number, date: string, currentId?: number): Attendance | undefined => {
    return attendanceRecords.find(record => 
      record.employeeId === employeeId && 
      new Date(record.date).toISOString().split('T')[0] === date &&
      // Exclude the current record when editing
      (currentId === undefined || record.id !== currentId)
    );
  };
  
  // Handle attendance form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attendanceForm.employeeId) {
      setError('Please select an employee');
      return;
    }
    
    // Check for existing attendance record for this employee on this date
    const existingAttendance = checkExistingAttendance(
      attendanceForm.employeeId, 
      attendanceForm.date,
      editMode && currentAttendance ? currentAttendance.id : undefined
    );
    
    if (existingAttendance) {
      setError(`This employee already has an attendance record for ${formatDate(attendanceForm.date)}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a properly typed attendance object
      const formData: Omit<Attendance, 'id'> = {
        employeeId: attendanceForm.employeeId,
        date: attendanceForm.date,
        status: attendanceForm.status,
        overtimeDescription: attendanceForm.overtimeDescription,
        overtimeSalary: attendanceForm.overtimeSalary,
        overtimeHours: attendanceForm.overtimeHours, // NEW: Include overtime hours
        description: attendanceForm.description,
        // Add totalSalary calculation if needed (backend handles this)
      };
      
      let result;
      
      if (editMode && currentAttendance?.id) {
        // Update existing attendance
        const updateData: Attendance = {
          ...formData,
          id: currentAttendance.id
        };
        result = await updateAttendance(updateData);
        console.log('Attendance updated:', result);
        setSuccessMessage('Attendance record updated successfully');
      } else {
        // Add new attendance
        result = await addAttendance(formData);
        console.log('Attendance added:', result);
        setSuccessMessage('New attendance record added successfully');
      }
      
      // Update the local state with the new/updated record
      setAttendanceRecords(prev => {
        if (editMode) {
          return prev.map(att => att.id === result.id ? result : att);
        } else {
          return [...prev, result];
        }
      });
      
      // Clear form and close it
      resetForm();
      setFormVisible(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh the data
      loadData();
      
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance record');
      // We don't set isLoading to false here, to keep showing the loading state
    }
  };
  
  // Reset the form to default values
  const resetForm = () => {
    // Use the selectedEmployee or default to 0 (not null)
    const defaultEmployeeId = selectedEmployee || 
                             (employees.length > 0 && employees[0].id ? employees[0].id : 0);
    
    setAttendanceForm({
      employeeId: defaultEmployeeId,
      date: selectedDate,
      status: 'present',
      overtimeDescription: '',
      overtimeSalary: 0,
      overtimeHours: 0, // NEW: Reset overtime hours
      description: ''
    });
    setEditMode(false);
    setCurrentAttendance(null);
  };
  
  // Start editing an attendance record
  const handleEdit = (attendance: Attendance) => {
    setCurrentAttendance(attendance);
    setAttendanceForm({
      employeeId: attendance.employeeId,
      date: new Date(attendance.date).toISOString().split('T')[0],
      status: attendance.status as 'present' | 'absent' | 'overtime' | 'halfday',
      overtimeDescription: attendance.overtimeDescription || '',
      overtimeSalary: attendance.overtimeSalary || 0,
      overtimeHours: attendance.overtimeHours || 0, // NEW: Include overtime hours in edit
      description: attendance.description || ''
    });
    setEditMode(true);
    setFormVisible(true);
  };
  
  // Prepare to delete an attendance record
  const handleDeleteClick = (attendance: Attendance) => {
    setAttendanceToDelete(attendance);
    setShowDeleteConfirmation(true);
  };
  
  // Delete attendance record
  const confirmDelete = async () => {
    if (!attendanceToDelete || !attendanceToDelete.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteAttendance(attendanceToDelete.id);
      
      // Update local state
      setAttendanceRecords(prev => prev.filter(record => record.id !== attendanceToDelete.id));
      
      // Close confirmation modal
      setShowDeleteConfirmation(false);
      setAttendanceToDelete(null);
      
      // Show success message
      setSuccessMessage('Attendance record deleted successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh data
      loadData();
      
    } catch (err: any) {
      console.error('Error deleting attendance:', err);
      setError(err.message || 'Failed to delete attendance record');
    }
  };
  
  // Start adding a new attendance record
  const handleAdd = () => {
    resetForm();
    setFormVisible(true);
  };
  
  // Mark all active employees as present for the selected date
  const handlePresentAll = async () => {
    if (!employees.length) {
      setError("No active employees found");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results: Attendance[] = [];
      // Create attendance records for all active employees
      for (const employee of employees) {
        if (!employee.id) continue;
        
        // Check if attendance already exists for this employee on this date
        const existingRecord = attendanceRecords.find(
          record => record.employeeId === employee.id && new Date(record.date).toISOString().split('T')[0] === selectedDate
        );
        
        // If record exists, update it; otherwise create new
        const formData: Omit<Attendance, 'id'> = {
          employeeId: employee.id,
          date: selectedDate,
          status: 'present',
          overtimeDescription: '',
          overtimeSalary: 0,
          overtimeHours: 0, // NEW: Include overtime hours
          description: 'Marked present via bulk action'
        };
        
        let result;
        if (existingRecord?.id) {
          result = await updateAttendance({
            ...formData,
            id: existingRecord.id
          });
        } else {
          result = await addAttendance(formData);
        }
        
        results.push(result);
      }
      
      // Update local state with new records
      setAttendanceRecords(prev => {
        const updatedRecords = [...prev];
        
        // Replace or add new records
        results.forEach(result => {
          const index = updatedRecords.findIndex(r => 
            r.employeeId === result.employeeId && 
            new Date(r.date).toISOString().split('T')[0] === selectedDate
          );
          
          if (index >= 0) {
            updatedRecords[index] = result;
          } else {
            updatedRecords.push(result);
          }
        });
        
        return updatedRecords;
      });
      
      // Show success message
      setSuccessMessage('All employees marked present successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh the filtered data
      loadData();
      
    } catch (err: any) {
      console.error('Error marking all employees present:', err);
      setError(err.message || 'Failed to mark employees as present');
      // We don't set isLoading to false here, to keep showing the loading state
    }
  };

  // Mark all active employees as absent for the selected date
  const handleAbsentAll = async () => {
    if (!employees.length) {
      setError("No active employees found");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results: Attendance[] = [];
      // Create attendance records for all active employees
      for (const employee of employees) {
        if (!employee.id) continue;
        
        // Check if attendance already exists for this employee on this date
        const existingRecord = attendanceRecords.find(
          record => record.employeeId === employee.id && new Date(record.date).toISOString().split('T')[0] === selectedDate
        );
        
        // If record exists, update it; otherwise create new
        const formData: Omit<Attendance, 'id'> = {
          employeeId: employee.id,
          date: selectedDate,
          status: 'absent',
          overtimeDescription: '',
          overtimeSalary: 0,
          overtimeHours: 0, // NEW: Include overtime hours
          description: 'Marked absent via bulk action'
        };
        
        let result;
        if (existingRecord?.id) {
          result = await updateAttendance({
            ...formData,
            id: existingRecord.id
          });
        } else {
          result = await addAttendance(formData);
        }
        
        results.push(result);
      }
      
      // Update local state with new records
      setAttendanceRecords(prev => {
        const updatedRecords = [...prev];
        
        // Replace or add new records
        results.forEach(result => {
          const index = updatedRecords.findIndex(r => 
            r.employeeId === result.employeeId && 
            new Date(r.date).toISOString().split('T')[0] === selectedDate
          );
          
          if (index >= 0) {
            updatedRecords[index] = result;
          } else {
            updatedRecords.push(result);
          }
        });
        
        return updatedRecords;
      });
      
      // Show success message
      setSuccessMessage('All employees marked absent successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh the filtered data
      loadData();
      
    } catch (err: any) {
      console.error('Error marking all employees absent:', err);
      setError(err.message || 'Failed to mark employees as absent');
      // We don't set isLoading to false here, to keep showing the loading state
    }
  };
  
  // Generate calendar days for the current month view - FIXED FUNCTION
  const generateCalendarDays = () => {
    const days = [];
    // Create date object for the first day of the selected month
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    
    // Get first day of month in the week (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Get number of days in the month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Find attendance records for this day
      const dayAttendance = filteredRecords.filter(a => {
        const attDate = new Date(a.date);
        return attDate.getDate() === day && 
               attDate.getMonth() === selectedMonth && 
               attDate.getFullYear() === selectedYear;
      });
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${dateString === selectedDate ? 'selected' : ''} ${dayAttendance.length ? 'has-attendance' : ''}`}
          onClick={() => setSelectedDate(dateString)}
        >
          <div className="day-number">{day}</div>
          {dayAttendance.length > 0 && (
            <div className="day-attendance">
              {dayAttendance.map((att, index) => {
                const employee = employees.find(e => e.id === att.employeeId);
                return (
                  <div 
                    key={index} 
                    className={`attendance-badge ${att.status}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(att);
                    }}
                  >
                    <span className="badge-name">{employee?.name.split(' ')[0]}</span>
                    <span className="badge-status">
                      {att.status === 'present' && <i className="bi bi-check-circle-fill"></i>}
                      {att.status === 'absent' && <i className="bi bi-x-circle-fill"></i>}
                      {att.status === 'halfday' && <i className="bi bi-circle-half"></i>}
                      {att.status === 'overtime' && <i className="bi bi-clock-fill"></i>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  
  // Navigate to previous month
  const previousMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 0) {
        setSelectedYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 11) {
        setSelectedYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };
  
  // Go to today
  const goToToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDate(today.toISOString().split('T')[0]);
  };
  
  return (
    <div className="attendance-page">
      
      <main className="attendance-container">
        {/* Page Title & Actions */}
        <div className="attendance-header">
          <div className="header-title">
            <h1>
              <i className="bi bi-calendar-check"></i> 
              Attendance Management
            </h1>
            <p className="subtitle">Track and manage employee attendance records</p>
          </div>
          
          <div className="header-actions">
            {!showLoading && (
              <button className="btn btn-primary add-attendance-btn" onClick={handleAdd}>
                <i className="bi bi-plus-circle"></i>
                <span>Record Attendance</span>
              </button>
            )}
            
            {/* NEW: Employee Summary Button */}
            {!showLoading && (
              <button 
                className="btn btn-info employee-summary-btn" 
                onClick={showEmployeeListModal}
              >
                <i className="bi bi-people-fill"></i>
                <span>Employee Summary</span>
              </button>
            )}
            
            {/* Bulk action buttons */}
            {!showLoading && (
              <div className="bulk-attendance-actions">
                <button 
                  className="btn btn-success bulk-action-btn" 
                  onClick={handlePresentAll}
                  disabled={isLoading}
                >
                  <i className="bi bi-check-circle"></i>
                  <span>Present All</span>
                </button>
                <button 
                  className="btn btn-danger bulk-action-btn" 
                  onClick={handleAbsentAll}
                  disabled={isLoading}
                >
                  <i className="bi bi-x-circle"></i>
                  <span>Absent All</span>
                </button>
              </div>
            )}
            
            {/* Dark Mode Toggle Button */}
            <button 
              className="dark-mode-toggle" 
              onClick={toggleDarkMode} 
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}`}></i>
            </button>
          </div>
        </div>
        
        {/* Success Message */}
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
        
        {/* Error Message */}
        {error && !isLoading && (
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
        
        {/* Loading Container - Modified to include triple tap functionality */}
        {showLoading && (
          <div className="loading-container">
            <div className="loading-content" onClick={handleLoaderTap}>
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h3>Loading Attendance Data</h3>
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
        
        {/* Quick Filters Bar - Only show when not loading */}
        {!showLoading && (
          <div className="quick-filters">
            <div className="filters-left">
              {/* Show employee selector to all users, not just admins */}
              <div className="employee-filter">
                <select 
                  className="employee-select"
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="date-range-picker">
                <div className="input-group">
                  <span className="input-icon">
                    <i className="bi bi-calendar-event"></i>
                  </span>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    max={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                </div>
                <span className="range-separator">to</span>
                <div className="input-group">
                  <span className="input-icon">
                    <i className="bi bi-calendar-event"></i>
                  </span>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    min={dateRange.start}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="filters-right">
              <div className="search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search attendance records..."
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
              
              <div className="status-filter">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="halfday">Half Day</option>
                  <option value="overtime">Overtime</option>
                </select>
              </div>
              
              <div className="view-toggles">
                <button 
                  className={`view-toggle ${viewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => setViewMode('calendar')}
                  aria-label="Calendar view"
                >
                  <i className="bi bi-calendar3"></i>
                </button>
                <button 
                  className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Attendance Stats - Only show when not loading */}
        {!showLoading && (
          <div className="attendance-stats">
            <div className="stat-card">
              <div className="stat-icon present">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.present}</div>
                <div className="stat-label">Present</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon absent">
                <i className="bi bi-x-circle"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.absent}</div>
                <div className="stat-label">Absent</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon halfday">
                <i className="bi bi-circle-half"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.halfday}</div>
                <div className="stat-label">Half Day</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon overtime">
                <i className="bi bi-clock"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.overtime}</div>
                <div className="stat-label">Overtime</div>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalDays}</div>
                <div className="stat-label">Total Records</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Calendar View - Only show when not loading */}
        {viewMode === 'calendar' && !showLoading && (
          <div className="calendar-view">
            <div className="calendar-header">
              <div className="month-navigation">
                <button className="nav-btn" onClick={previousMonth}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <h2 className="current-month">
                  {getMonthName(selectedMonth)} {selectedYear}
                </h2>
                <button className="nav-btn" onClick={nextMonth}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              <button className="today-btn" onClick={goToToday}>
                Today
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
            
            <div className="calendar-grid">
              {generateCalendarDays()}
            </div>
            
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-color present"></span>
                <span className="legend-label">Present</span>
              </div>
              <div className="legend-item">
                <span className="legend-color absent"></span>
                <span className="legend-label">Absent</span>
              </div>
              <div className="legend-item">
                <span className="legend-color halfday"></span>
                <span className="legend-label">Half Day</span>
              </div>
              <div className="legend-item">
                <span className="legend-color overtime"></span>
                <span className="legend-label">Overtime</span>
              </div>
            </div>
          </div>
        )}
        
        {/* List View - Only show when not loading */}
        {viewMode === 'list' && !showLoading && (
          <div className="list-view">
            {filteredRecords.length === 0 ? (
              <div className="no-records">
                <div className="no-records-icon">
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3>No Attendance Records Found</h3>
                <p>No records match your current search criteria</p>
                <button className="btn btn-outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRange({
                    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  });
                }}>
                  <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
                </button>
              </div>
            ) : (
              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>Attendance Type</th>
                      <th>Description</th>
                      <th>Salary Credit</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const employee = employees.find(e => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className={record.status}>
                          <td className="date-cell">
                            <div className="date-primary">{formatDate(record.date)}</div>
                            <div className="date-secondary">
                              {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </td>
                          
                          {/* Employee info column */}
                          <td className="employee-cell">
                            <div className="employee-name">{employee?.name || 'Unknown'}</div>
                            <div className="employee-role">{employee?.role}</div>
                          </td>
                          
                          {/* Status column (Active/Inactive) */}
                          <td className="employee-status-cell">
                            <div className={`employee-status ${employee?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'}`}>
                              {employee?.status || 'Active'}
                            </div>
                          </td>
                          
                          {/* Attendance Type column (Present/Absent/etc) */}
                          <td className="attendance-type-cell">
                            <div className={`attendance-type ${record.status}`}>
                              {record.status === 'present' && <i className="bi bi-check-circle-fill"></i>}
                              {record.status === 'absent' && <i className="bi bi-x-circle-fill"></i>}
                              {record.status === 'halfday' && <i className="bi bi-circle-half"></i>}
                              {record.status === 'overtime' && <i className="bi bi-clock-fill"></i>}
                              <span className="type-text">
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </div>
                            {record.status === 'overtime' && record.overtimeSalary && (
                              <div className="overtime-info">
                                <span className="overtime-amount">
                                  +{formatCurrency(record.overtimeSalary)}
                                </span>
                                {/* NEW: Show overtime hours if available */}
                                {record.overtimeHours && (
                                  <span className="overtime-hours">
                                    {record.overtimeHours}h
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          
                          <td className="description-cell">
                            <div className="description-text">
                              {record.description || 
                              (record.status === 'overtime' ? record.overtimeDescription : 'No description')}
                            </div>
                          </td>
                          
                          <td className="salary-cell">
                            <div className="salary-amount">
                              {formatCurrency(record.totalSalary || 0)}
                            </div>
                          </td>
                          
                          <td className="actions-cell">
                            <button 
                              className="action-btn edit"
                              onClick={() => handleEdit(record)}
                              title="Edit record"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteClick(record)}
                              title="Delete record"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Form Modal */}
        {formVisible && (
          <div className="modal-overlay" onClick={() => setFormVisible(false)}>
            <div className="attendance-form-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="header-content">
                  <h3>
                    <i className={`bi ${editMode ? 'bi-pencil-square' : 'bi-calendar-plus'}`}></i>
                    {editMode ? 'Edit Attendance Record' : 'Record New Attendance'}
                  </h3>
                  <p className="modal-subtitle">
                    {editMode 
                      ? 'Update attendance information for the selected record' 
                      : 'Add a new attendance record for an employee'}
                  </p>
                </div>
                <button className="close-btn" onClick={() => setFormVisible(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="attendance-form">
                  <div className="form-grid">
                    {/* Employee Selection */}
                    <div className="form-group employee-selection">
                      <label htmlFor="employeeId">
                        <i className="bi bi-person-badge"></i> Employee <span className="required">*</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="employeeId"
                          name="employeeId"
                          value={attendanceForm.employeeId || ''}
                          onChange={handleInputChange}
                          required
                          className="employee-dropdown"
                          disabled={editMode} // Disable in edit mode to prevent changing employee
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.role}
                            </option>
                          ))}
                        </select>
                        <div className="select-icon">
                          <i className="bi bi-chevron-down"></i>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date Field */}
                    <div className="form-group date-selection">
                      <label htmlFor="date">
                        <i className="bi bi-calendar-date"></i> Date <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={attendanceForm.date}
                          onChange={handleInputChange}
                          max={new Date().toISOString().split('T')[0]}
                          required
                          className="date-input"
                          disabled={editMode} // Disable in edit mode to prevent changing date
                        />
                        <div className="input-icon">
                          <i className="bi bi-calendar-check"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Field with improved visual design */}
                  <div className="form-group">
                    <label className="status-label">
                      <i className="bi bi-check2-circle"></i> Attendance Status <span className="required">*</span>
                    </label>
                    <div className="status-options">
                      <label className={`status-option ${attendanceForm.status === 'present' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="present"
                          checked={attendanceForm.status === 'present'}
                          onChange={handleInputChange}
                        />
                        <div className="status-icon present">
                          <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <span>Present</span>
                      </label>
                      
                      <label className={`status-option ${attendanceForm.status === 'absent' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="absent"
                          checked={attendanceForm.status === 'absent'}
                          onChange={handleInputChange}
                        />
                        <div className="status-icon absent">
                          <i className="bi bi-x-circle-fill"></i>
                        </div>
                        <span>Absent</span>
                      </label>
                      
                      <label className={`status-option ${attendanceForm.status === 'halfday' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="halfday"
                          checked={attendanceForm.status === 'halfday'}
                          onChange={handleInputChange}
                        />
                        <div className="status-icon halfday">
                          <i className="bi bi-circle-half"></i>
                        </div>
                        <span>Half Day</span>
                      </label>
                      
                      <label className={`status-option ${attendanceForm.status === 'overtime' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="overtime"
                          checked={attendanceForm.status === 'overtime'}
                          onChange={handleInputChange}
                        />
                        <div className="status-icon overtime">
                          <i className="bi bi-clock-fill"></i>
                        </div>
                        <span>Overtime</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Overtime Details (shown only if overtime is selected) */}
                  {attendanceForm.status === 'overtime' && (
                    <div className="overtime-details">
                      <div className="overtime-header">
                        <i className="bi bi-clock-history"></i>
                        <span>Overtime Details</span>
                      </div>
                      
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="overtimeDescription">
                            <i className="bi bi-card-text"></i> Description <span className="required">*</span>
                          </label>
                          <textarea
                            id="overtimeDescription"
                            name="overtimeDescription"
                            value={attendanceForm.overtimeDescription}
                            onChange={handleInputChange}
                            placeholder="Describe the overtime work performed"
                            required
                            className="overtime-textarea"
                          ></textarea>
                        </div>
                        
                        {/* NEW: Overtime Hours Field */}
                        <div className="form-group">
                          <label htmlFor="overtimeHours">
                            <i className="bi bi-clock"></i> Overtime Hours <span className="required">*</span>
                          </label>
                          <div className="hours-input">
                            <input
                              type="number"
                              id="overtimeHours"
                              name="overtimeHours"
                              value={attendanceForm.overtimeHours}
                              onChange={handleInputChange}
                              min="0"
                              max="24"
                              step="0.5"
                              placeholder="0"
                              required
                              className="hours-field"
                            />
                            <div className="hours-indicator">hrs</div>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="overtimeSalary">
                            <i className="bi bi-currency-dollar"></i> Overtime Pay <span className="required">*</span>
                          </label>
                          <div className="salary-input">
                            <div className="currency-indicator">₹</div>
                            <input
                              type="number"
                              id="overtimeSalary"
                              name="overtimeSalary"
                              value={attendanceForm.overtimeSalary}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              required
                              className="salary-field"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Description Field */}
                  <div className="form-group notes-group">
                    <label htmlFor="description">
                      <i className="bi bi-journal-text"></i> Additional Notes
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={attendanceForm.description}
                      onChange={handleInputChange}
                      placeholder="Add any additional notes or comments here (optional)"
                      className="notes-textarea"
                    ></textarea>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-cancel" 
                      onClick={() => setFormVisible(false)}
                    >
                      <i className="bi bi-x-circle"></i> Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-submit"
                      disabled={showLoading}
                    >
                      {showLoading ? (
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
                          <i className={`bi ${editMode ? 'bi-check-circle' : 'bi-save'}`}></i>
                          {editMode ? 'Update Record' : 'Save Record'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="delete-confirmation-modal">
              <div className="modal-header">
                <div className="header-content">
                  <h3>
                    <i className="bi bi-exclamation-triangle"></i>
                    Confirm Deletion
                  </h3>
                </div>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setAttendanceToDelete(null);
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="confirmation-message">
                  <p>Are you sure you want to delete this attendance record?</p>
                  
                  {attendanceToDelete && (
                    <div className="record-details">
                      <div className="detail-row">
                        <span className="detail-label">Employee:</span>
                        <span className="detail-value">
                          {employees.find(e => e.id === attendanceToDelete.employeeId)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(attendanceToDelete.date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-badge ${attendanceToDelete.status}`}>
                          {attendanceToDelete.status.charAt(0).toUpperCase() + attendanceToDelete.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="warning-message">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>This action cannot be undone.</span>
                  </div>
                </div>
                
                <div className="confirmation-actions">
                  <button 
                    className="btn btn-cancel" 
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setAttendanceToDelete(null);
                    }}
                  >
                    <i className="bi bi-x-circle"></i> Cancel
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={confirmDelete}
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
                        <i className="bi bi-trash"></i> Delete Record
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Employee List Modal */}
        {showEmployeeModal && (
          <div className="modal-overlay">
            <div className="employee-list-modal">
              <div className="modal-header">
                <div className="header-content">
                  <h3>
                    <i className="bi bi-people-fill"></i>
                    Select Employee for Attendance Summary
                  </h3>
                  
                  {/* Month and Year Selection inside Employee Modal */}
                  <div className="summary-month-year-selector">
                    <div className="input-group">
              
                      <select 
                        className="month-select"
                        value={summaryMonth}
                        onChange={(e) => setSummaryMonth(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {getMonthName(i)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <select 
                        className="year-select"
                        value={summaryYear}
                        onChange={(e) => setSummaryYear(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  
                  <p className="modal-subtitle">
                    Viewing data for {getMonthName(summaryMonth)} {summaryYear}
                  </p>
                </div>
                <button 
                  className="close-btn" 
                  onClick={() => setShowEmployeeModal(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="employee-grid">
                  {employees.map(employee => (
                    <div 
                      key={employee.id} 
                      className="employee-card"
                      onClick={() => handleEmployeeSelection(employee.id!)}
                    >
                      <div className="employee-avatar">
                        <div className="avatar-text">
                          {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="employee-info">
                        <div className="employee-name">{employee.name}</div>
                        <div className="employee-role">{employee.role}</div>
                        <div className="employee-status">
                          <i className={`bi ${employee.status === 'active' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                          <span>{employee.status}</span>
                        </div>
                      </div>
                      <div className="card-arrow">
                        <i className="bi bi-chevron-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Employee Attendance Summary Modal */}
        {showEmployeeSummaryModal && selectedEmployeeSummary && (
          <div className="modal-overlay">
            <div className="employee-summary-modal">
              <div className="modal-header">
                <div className="header-content">
                  <h3>
                    <i className="bi bi-person-lines-fill"></i>
                    Attendance Summary
                  </h3>
                  <p className="modal-subtitle">
                    {selectedEmployeeSummary.employeeName} - {getMonthName(selectedEmployeeSummary.month)} {selectedEmployeeSummary.year}
                  </p>
                </div>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setShowEmployeeSummaryModal(false);
                    setSelectedEmployeeSummary(null);
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="summary-cards">
                  <div className="summary-card present">
                    <div className="card-icon">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{selectedEmployeeSummary.presentCount}</div>
                      <div className="card-label">Present Days</div>
                    </div>
                  </div>
                  
                  <div className="summary-card absent">
                    <div className="card-icon">
                      <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{selectedEmployeeSummary.absentCount}</div>
                      <div className="card-label">Absent Days</div>
                    </div>
                  </div>
                  
                  <div className="summary-card halfday">
                    <div className="card-icon">
                      <i className="bi bi-circle-half"></i>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{selectedEmployeeSummary.halfdayCount}</div>
                      <div className="card-label">Half Days</div>
                    </div>
                  </div>
                  
                  <div className="summary-card overtime">
                    <div className="card-icon">
                      <i className="bi bi-clock-fill"></i>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{selectedEmployeeSummary.overtimeCount}</div>
                      <div className="card-label">Overtime Days</div>
                    </div>
                  </div>
                </div>
                
                <div className="additional-info">
                  <div className="info-row">
                    <div className="info-item">
                      <i className="bi bi-calendar-check"></i>
                      <span className="info-label">Total Records:</span>
                      <span className="info-value">{selectedEmployeeSummary.totalRecords}</span>
                    </div>
                    
                    <div className="info-item">
                      <i className="bi bi-clock-history"></i>
                      <span className="info-label">Total Overtime Hours:</span>
                      <span className="info-value">{selectedEmployeeSummary.totalOvertimeHours}h</span>
                    </div>
                  </div>
                  
                  <div className="attendance-percentage">
                    <div className="percentage-label">Attendance Rate:</div>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill" 
                        style={{ 
                          width: `${selectedEmployeeSummary.totalRecords > 0 
                            ? (selectedEmployeeSummary.presentCount + selectedEmployeeSummary.halfdayCount * 0.5 + selectedEmployeeSummary.overtimeCount) / selectedEmployeeSummary.totalRecords * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="percentage-value">
                      {selectedEmployeeSummary.totalRecords > 0 
                        ? Math.round((selectedEmployeeSummary.presentCount + selectedEmployeeSummary.halfdayCount * 0.5 + selectedEmployeeSummary.overtimeCount) / selectedEmployeeSummary.totalRecords * 100)
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AttendancePage;
