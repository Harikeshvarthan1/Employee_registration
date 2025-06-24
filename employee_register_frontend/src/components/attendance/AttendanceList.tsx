// src/components/attendance/AttendanceList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllAttendance, 
  deleteAttendance
} from '../../apis/attendanceApi';
import { getAllActiveEmployees } from '../../apis/employeeApi';
import { formatDate, formatCurrency } from '../../utils/dateUtils';
import type { Attendance, Employee, AttendanceSummary } from '../../models/types';
import './AttendanceList.css';

// Calendar view date cell interface
interface CalendarDay {
  date: Date;
  attendances: Attendance[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const AttendanceList: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlyData, setMonthlyData] = useState<CalendarDay[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'list' | 'summary'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  const [showBulkActionPanel, setShowBulkActionPanel] = useState<boolean>(false);
  const [selectedAttendances, setSelectedAttendances] = useState<Attendance[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  
  const [filters, setFilters] = useState({
    employeeId: 0,
    status: 'all',
    fromDate: '',
    toDate: '',
    searchTerm: '',
  });
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const employeesData = await getAllActiveEmployees();
        setEmployees(employeesData);
        
        const attendanceData = await getAllAttendance();
        
        const enhancedAttendance = attendanceData.map(attendance => {
          const employee = employeesData.find(emp => emp.id === attendance.employeeId);
          return {
            ...attendance,
            employeeName: employee ? employee.name : 'Unknown Employee'
          };
        });
        
        setAttendances(enhancedAttendance);
        setFilteredAttendances(enhancedAttendance);
        
        generateCalendarData(enhancedAttendance, currentMonth);
      } catch (error: any) {
        console.error('Error loading attendance data:', error);
        setError(error.message || 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attendances]);
  
  const applyFilters = useCallback(() => {
    let filtered = [...attendances];
    
    if (filters.employeeId > 0) {
      filtered = filtered.filter(att => att.employeeId === filters.employeeId);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(att => att.status === filters.status);
    }
    
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      filtered = filtered.filter(att => new Date(att.date) >= fromDate);
    }
    
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(att => new Date(att.date) <= toDate);
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(att => 
        att.employeeName?.toLowerCase().includes(term) ||
        att.description?.toLowerCase().includes(term) ||
        att.overtimeDescription?.toLowerCase().includes(term)
      );
    }
    
    setFilteredAttendances(filtered);
    
    if (view === 'calendar') {
      generateCalendarData(filtered, currentMonth);
    }
    
    calculateSummary(filtered);
    
    setSelectedAttendances([]);
    setSelectAllChecked(false);
    
  }, [attendances, filters, currentMonth, view]);

  const generateCalendarData = (attData: Attendance[], month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfCalendar.getDay();
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - dayOfWeek);
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    const lastDayOfWeek = lastDayOfCalendar.getDay();
    lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + (6 - lastDayOfWeek));
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDay = new Date(firstDayOfCalendar);
    while (currentDay <= lastDayOfCalendar) {
      const dayAttendances = attData.filter(att => {
        const attDate = new Date(att.date);
        return (
          attDate.getDate() === currentDay.getDate() &&
          attDate.getMonth() === currentDay.getMonth() &&
          attDate.getFullYear() === currentDay.getFullYear()
        );
      });
      
      days.push({
        date: new Date(currentDay),
        attendances: dayAttendances,
        isCurrentMonth: currentDay.getMonth() === monthIndex,
        isToday: 
          currentDay.getDate() === today.getDate() &&
          currentDay.getMonth() === today.getMonth() &&
          currentDay.getFullYear() === today.getFullYear()
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setMonthlyData(days);
  };
  
  const calculateSummary = (data: Attendance[]) => {
    if (!data.length) {
      setAttendanceSummary(null);
      return;
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthAttendance = data.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
    });
    const presentDays = currentMonthAttendance.filter(att => att.status === 'present').length;
    const absentDays = currentMonthAttendance.filter(att => att.status === 'absent').length;
    const halfDays = currentMonthAttendance.filter(att => att.status === 'halfday').length;
    const overtimeDays = currentMonthAttendance.filter(att => att.status === 'overtime').length;
    const totalOvertimeSalary = currentMonthAttendance.reduce((total, att) => 
      total + (att.overtimeSalary || 0), 0);
    const totalOvertimeHours = currentMonthAttendance.reduce((total, att) =>
      total + (att.overtimeHours || 0), 0);
    const totalSalary = currentMonthAttendance.reduce((total, att) => 
      total + (att.totalSalary || 0), 0);
    setAttendanceSummary({
      employeeId: filters.employeeId || 0,
      month: currentMonth,
      year: currentYear,
      presentDays,
      absentDays,
      halfDays,
      overtimeDays,
      totalDays: currentMonthAttendance.length,
      totalSalary,
      totalOvertimeSalary,
      totalOvertimeHours
    });
  };
  
  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    generateCalendarData(filteredAttendances, newMonth);
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    generateCalendarData(filteredAttendances, today);
    if (calendarRef.current) {
      const todayEl = calendarRef.current.querySelector('.calendar-day.today');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  const resetFilters = () => {
    setFilters({
      employeeId: 0,
      status: 'all',
      fromDate: '',
      toDate: '',
      searchTerm: '',
    });
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name === 'employeeId' ? parseInt(value, 10) || 0 : value
    }));
  };
  
  const handleDelete = async () => {
    if (!attendanceToDelete) return;
    
    setLoading(true);
    try {
      await deleteAttendance(attendanceToDelete.id!);
      setAttendances(prev => prev.filter(att => att.id !== attendanceToDelete.id));
      setFilteredAttendances(prev => prev.filter(att => att.id !== attendanceToDelete.id));
      setShowDeleteModal(false);
      setAttendanceToDelete(null);
    } catch (error: any) {
      setError(error.message || 'Failed to delete attendance record');
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDelete = (attendance: Attendance) => {
    setAttendanceToDelete(attendance);
    setShowDeleteModal(true);
  };
  
  const toggleSelection = (attendance: Attendance) => {
    if (selectedAttendances.some(att => att.id === attendance.id)) {
      setSelectedAttendances(prev => prev.filter(att => att.id !== attendance.id));
    } else {
      setSelectedAttendances(prev => [...prev, attendance]);
    }
  };
  
  const toggleSelectAll = () => {
    if (selectAllChecked) {
      setSelectedAttendances([]);
    } else {
      setSelectedAttendances([...filteredAttendances]);
    }
    setSelectAllChecked(!selectAllChecked);
  };
  
  const handleBulkDelete = async () => {
    if (!selectedAttendances.length) return;
    
    setLoading(true);
    try {
      await Promise.all(
        selectedAttendances.map(att => deleteAttendance(att.id!))
      );
      const selectedIds = selectedAttendances.map(att => att.id);
      setAttendances(prev => prev.filter(att => !selectedIds.includes(att.id)));
      setFilteredAttendances(prev => prev.filter(att => !selectedIds.includes(att.id)));
      setSelectedAttendances([]);
      setSelectAllChecked(false);
      setShowBulkActionPanel(false);
    } catch (error: any) {
      setError(error.message || 'Failed to delete attendance records');
    } finally {
      setLoading(false);
    }
  };
  
  const exportData = (format: 'csv' | 'pdf' | 'excel') => {
    alert(`Exporting attendance data in ${format.toUpperCase()} format`);
    setShowExportOptions(false);
  };
  
  const navigateToAddAttendance = () => {
    navigate('/attendance/add');
  };
  
  const navigateToEditAttendance = (attendance: Attendance) => {
    navigate(`/attendance/edit/${attendance.id}`);
  };
  
  const renderMonthYear = () => {
    const options = { month: 'long', year: 'numeric' } as Intl.DateTimeFormatOptions;
    return currentMonth.toLocaleDateString('en-US', options);
  };
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'present':
        return { color: 'var(--success-color, #4cc9f0)', icon: 'bi-check-circle-fill' };
      case 'absent':
        return { color: 'var(--danger-color, #f72585)', icon: 'bi-x-circle-fill' };
      case 'halfday':
        return { color: 'var(--warning-color, #ffbe0b)', icon: 'bi-circle-half' };
      case 'overtime':
        return { color: 'var(--primary-color, #4361ee)', icon: 'bi-alarm-fill' };
      default:
        return { color: 'var(--text-secondary, #6c757d)', icon: 'bi-question-circle-fill' };
    }
  };

  const renderAttendanceDots = (attendances: Attendance[]) => {
    if (!attendances.length) return null;
    
    const counts = {
      present: attendances.filter(att => att.status === 'present').length,
      absent: attendances.filter(att => att.status === 'absent').length,
      halfday: attendances.filter(att => att.status === 'halfday').length,
      overtime: attendances.filter(att => att.status === 'overtime').length,
    };
    
    return (
      <div className="attendance-dots">
        {counts.present > 0 && (
          <div className="dot present" title={`${counts.present} Present`}>
            {counts.present > 1 && <span className="count">{counts.present}</span>}
          </div>
        )}
        {counts.absent > 0 && (
          <div className="dot absent" title={`${counts.absent} Absent`}>
            {counts.absent > 1 && <span className="count">{counts.absent}</span>}
          </div>
        )}
        {counts.halfday > 0 && (
          <div className="dot halfday" title={`${counts.halfday} Half Day`}>
            {counts.halfday > 1 && <span className="count">{counts.halfday}</span>}
          </div>
        )}
        {counts.overtime > 0 && (
          <div className="dot overtime" title={`${counts.overtime} Overtime`}>
            {counts.overtime > 1 && <span className="count">{counts.overtime}</span>}
          </div>
        )}
      </div>
    );
  };
  
  const renderStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo(status);
    return (
      <div className={`status-badge ${status}`}>
        <i className={`bi ${statusInfo.icon}`}></i>
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
    );
  };
  
  const getDayOfWeek = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };
  
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="attendance-list-container">
      {/* Header */}
      <div className="attendance-header">
        <div className="header-title">
          <h2><i className="bi bi-calendar-check"></i> Attendance Management</h2>
          <p className="subtitle">Track and manage employee attendance records</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary add-attendance-btn"
            onClick={navigateToAddAttendance}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Record Attendance</span>
          </button>
          
          <button 
            className="btn btn-outline export-btn"
            onClick={() => setShowExportOptions(!showExportOptions)}
          >
            <i className="bi bi-download"></i>
            <span>Export</span>
          </button>
          
          {showExportOptions && (
            <div className="export-dropdown">
              <button onClick={() => exportData('csv')}>
                <i className="bi bi-filetype-csv"></i> Export as CSV
              </button>
              <button onClick={() => exportData('excel')}>
                <i className="bi bi-file-earmark-excel"></i> Export as Excel
              </button>
              <button onClick={() => exportData('pdf')}>
                <i className="bi bi-file-earmark-pdf"></i> Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* View Switcher */}
      <div className="view-switcher">
        <button 
          className={`view-btn ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <i className="bi bi-calendar3"></i>
          <span>Calendar View</span>
        </button>
        
        <button 
          className={`view-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          <i className="bi bi-list-ul"></i>
          <span>List View</span>
        </button>
        
        <button 
          className={`view-btn ${view === 'summary' ? 'active' : ''}`}
          onClick={() => setView('summary')}
        >
          <i className="bi bi-pie-chart"></i>
          <span>Summary View</span>
        </button>
      </div>
      
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="employeeId">Employee</label>
          <select 
            id="employeeId" 
            name="employeeId"
            value={filters.employeeId}
            onChange={handleFilterChange}
          >
            <option value={0}>All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select 
            id="status" 
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="halfday">Half Day</option>
            <option value="overtime">Overtime</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="fromDate">From Date</label>
          <input 
            type="date" 
            id="fromDate" 
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="toDate">To Date</label>
          <input 
            type="date" 
            id="toDate" 
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group search-group">
          <input 
            type="text" 
            id="searchTerm" 
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Search..."
            className="search-input"
          />
          <i className="bi bi-search search-icon"></i>
          
          {filters.searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setFilters({...filters, searchTerm: ''})}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Active Filters */}
      {(filters.employeeId > 0 || filters.status !== 'all' || filters.fromDate || filters.toDate || filters.searchTerm) && (
        <div className="active-filters">
          <div className="filter-tags">
            {filters.employeeId > 0 && (
              <div className="filter-tag">
                <i className="bi bi-person"></i>
                <span>
                  {employees.find(emp => emp.id === filters.employeeId)?.name || 'Employee'}
                </span>
                <button onClick={() => setFilters({...filters, employeeId: 0})}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {filters.status !== 'all' && (
              <div className="filter-tag">
                <i className={`bi ${getStatusInfo(filters.status).icon}`}></i>
                <span>{filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}</span>
                <button onClick={() => setFilters({...filters, status: 'all'})}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {filters.fromDate && (
              <div className="filter-tag">
                <i className="bi bi-calendar-event"></i>
                <span>From: {formatDate(filters.fromDate)}</span>
                <button onClick={() => setFilters({...filters, fromDate: ''})}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {filters.toDate && (
              <div className="filter-tag">
                <i className="bi bi-calendar-event"></i>
                <span>To: {formatDate(filters.toDate)}</span>
                <button onClick={() => setFilters({...filters, toDate: ''})}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            
            {filters.searchTerm && (
              <div className="filter-tag">
                <i className="bi bi-search"></i>
                <span>"{filters.searchTerm}"</span>
                <button onClick={() => setFilters({...filters, searchTerm: ''})}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>
          
          <button className="reset-filters" onClick={resetFilters}>
            <i className="bi bi-arrow-counterclockwise"></i>
            <span>Reset Filters</span>
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="bi bi-exclamation-circle"></i>
          <h3>Error Loading Attendance Data</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise"></i> Try Again
          </button>
        </div>
      )}
      
      {/* Bulk Actions Panel */}
      {showBulkActionPanel && selectedAttendances.length > 0 && (
        <div className="bulk-action-panel">
          <div className="selection-info">
            <i className="bi bi-check-square"></i>
            <span>{selectedAttendances.length} record(s) selected</span>
          </div>
          
          <div className="bulk-actions">
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              <i className="bi bi-trash"></i>
              <span>Delete Selected</span>
            </button>
            
            <button className="btn btn-outline" onClick={() => setSelectedAttendances([])}>
              <i className="bi bi-x"></i>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
      
      {/* No Records Message */}
      {!loading && !error && filteredAttendances.length === 0 && (
        <div className="no-records">
          <div className="no-records-icon">
            <i className="bi bi-calendar-x"></i>
          </div>
          <h3>No Attendance Records Found</h3>
          <p>There are no attendance records matching your current filters.</p>
          {(filters.employeeId > 0 || filters.status !== 'all' || filters.fromDate || filters.toDate || filters.searchTerm) && (
            <button className="btn btn-outline" onClick={resetFilters}>
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Reset Filters</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={navigateToAddAttendance}>
            <i className="bi bi-plus-lg"></i>
            <span>Record New Attendance</span>
          </button>
        </div>
      )}
      
      {/* Calendar View */}
      {!loading && !error && view === 'calendar' && filteredAttendances.length > 0 && (
        <div className="calendar-view">
          <div className="calendar-header">
            <div className="month-navigation">
              <button className="nav-btn" onClick={() => changeMonth('prev')}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3>{renderMonthYear()}</h3>
              <button className="nav-btn" onClick={() => changeMonth('next')}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            
            <button className="today-btn" onClick={goToToday}>
              <i className="bi bi-calendar-day"></i>
              <span>Today</span>
            </button>
          </div>
          
          <div className="calendar-grid" ref={calendarRef}>
            {/* Days of week */}
            <div className="calendar-weekdays">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <div key={day} className="weekday">
                  {getDayOfWeek(day)}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="calendar-days">
              {monthlyData.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.isToday ? 'today' : ''} ${isWeekend(day.date) ? 'weekend' : ''}`}
                >
                  <div className="day-header">
                    <span className="day-number">{day.date.getDate()}</span>
                    {day.isToday && <span className="today-marker">Today</span>}
                  </div>
                  
                  {day.attendances.length > 0 ? (
                    <>
                      {renderAttendanceDots(day.attendances)}
                      <div className="day-attendances">
                        {day.attendances.length <= 3 ? (
                          day.attendances.map((att, attIdx) => (
                            <div 
                              key={attIdx} 
                              className="attendance-item"
                              onClick={() => navigateToEditAttendance(att)}
                            >
                              <div className={`status-indicator ${att.status}`}></div>
                              <span className="employee-name" title={att.employeeName}>
                                {att.employeeName}
                              </span>
                            </div>
                          ))
                        ) : (
                          <>
                            {day.attendances.slice(0, 2).map((att, attIdx) => (
                              <div 
                                key={attIdx} 
                                className="attendance-item"
                                onClick={() => navigateToEditAttendance(att)}
                              >
                                <div className={`status-indicator ${att.status}`}></div>
                                <span className="employee-name" title={att.employeeName}>
                                  {att.employeeName}
                                </span>
                              </div>
                            ))}
                            <div 
                              className="more-attendances"
                              title={`${day.attendances.length - 2} more attendance records`}
                            >
                              +{day.attendances.length - 2} more
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    day.isCurrentMonth && (
                      <button 
                        className="add-attendance-day"
                        onClick={() => {
                          const date = day.date.toISOString().split('T')[0];
                          navigate(`/attendance/add?date=${date}`);
                        }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* List View */}
      {!loading && !error && view === 'list' && filteredAttendances.length > 0 && (
        <div className="list-view">
          <div className="list-header">
            {showBulkActionPanel && (
              <div className="select-all-container">
                <input 
                  type="checkbox" 
                  id="selectAll" 
                  checked={selectAllChecked}
                  onChange={toggleSelectAll}
                />
                <label htmlFor="selectAll">Select All</label>
              </div>
            )}
            
            <button 
              className={`bulk-select-btn ${showBulkActionPanel ? 'active' : ''}`}
              onClick={() => setShowBulkActionPanel(!showBulkActionPanel)}
            >
              <i className={`bi ${showBulkActionPanel ? 'bi-x-lg' : 'bi-check-square'}`}></i>
              <span>{showBulkActionPanel ? 'Cancel Selection' : 'Select Records'}</span>
            </button>
            
            <div className="record-count">
              <i className="bi bi-list-check"></i>
              <span>{filteredAttendances.length} Records</span>
            </div>
          </div>
          
          <div className="attendance-list">
            {filteredAttendances.map(attendance => (
              <div key={attendance.id} className="attendance-card">
                {showBulkActionPanel && (
                  <div className="select-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedAttendances.some(att => att.id === attendance.id)}
                      onChange={() => toggleSelection(attendance)}
                    />
                  </div>
                )}
                
                <div className="card-main">
                  <div className="card-header">
                    <div className="employee-info">
                      <div className="avatar">
                        {attendance.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="details">
                        <h4>{attendance.employeeName}</h4>
                        <span className="date">
                          <i className="bi bi-calendar3"></i> 
                          {formatDate(attendance.date)}
                        </span>
                      </div>
                    </div>
                    
                    {renderStatusBadge(attendance.status)}
                  </div>
                  
                  <div className="card-body">
                    {attendance.status === 'overtime' && (
                      <div className="overtime-details">
                        <div className="detail-item">
                          <span className="label">Overtime Work:</span>
                          <span className="value">{attendance.overtimeDescription || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Overtime Pay:</span>
                          <span className="value">{attendance.overtimeSalary ? formatCurrency(attendance.overtimeSalary) : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                    
                    {attendance.description && (
                      <div className="description">
                        <span className="label">Notes:</span>
                        <p>{attendance.description}</p>
                      </div>
                    )}
                    
                    {attendance.totalSalary !== undefined && attendance.totalSalary > 0 && (
                      <div className="salary-info">
                        <i className="bi bi-cash"></i>
                        <span>{formatCurrency(attendance.totalSalary)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="action-btn edit"
                    onClick={() => navigateToEditAttendance(attendance)}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>
                  
                  <button 
                    className="action-btn delete"
                    onClick={() => confirmDelete(attendance)}
                  >
                    <i className="bi bi-trash"></i>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Summary View */}
      {!loading && !error && view === 'summary' && (
        <div className="summary-view">
          {attendanceSummary ? (
            <>
              <div className="summary-header">
                <h3>
                  <i className="bi bi-pie-chart-fill"></i>
                  Monthly Attendance Summary
                </h3>
                <p>
                  {filters.employeeId > 0
                    ? `Summary for ${employees.find(emp => emp.id === filters.employeeId)?.name || 'Employee'}`
                    : 'Summary for All Employees'}
                </p>
              </div>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon present">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div className="card-content">
                    <span className="card-value">{attendanceSummary.presentDays}</span>
                    <span className="card-label">Present Days</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon absent">
                    <i className="bi bi-x-circle-fill"></i>
                  </div>
                  <div className="card-content">
                    <span className="card-value">{attendanceSummary.absentDays}</span>
                    <span className="card-label">Absent Days</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon halfday">
                    <i className="bi bi-circle-half"></i>
                  </div>
                  <div className="card-content">
                    <span className="card-value">{attendanceSummary.halfDays}</span>
                    <span className="card-label">Half Days</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon overtime">
                    <i className="bi bi-alarm-fill"></i>
                  </div>
                  <div className="card-content">
                    <span className="card-value">{attendanceSummary.overtimeDays}</span>
                    <span className="card-label">Overtime Days</span>
                  </div>
                </div>
              </div>
              
              <div className="total-summary">
                <div className="total-item">
                  <div className="total-label">
                    <i className="bi bi-calendar-check"></i>
                    <span>Total Tracked Days:</span>
                  </div>
                  <div className="total-value">{attendanceSummary.totalDays}</div>
                </div>
                
                <div className="total-item">
                  <div className="total-label">
                    <i className="bi bi-cash-stack"></i>
                    <span>Total Salary:</span>
                  </div>
                  <div className="total-value">{formatCurrency(attendanceSummary.totalSalary)}</div>
                </div>
                
                <div className="total-item">
                  <div className="total-label">
                    <i className="bi bi-alarm"></i>
                    <span>Total Overtime Pay:</span>
                  </div>
                  <div className="total-value">{formatCurrency(attendanceSummary.totalOvertimeSalary)}</div>
                </div>
              </div>
              
              <div className="attendance-ratio">
                <h4>Attendance Breakdown</h4>
                <div className="ratio-bar">
                  {attendanceSummary.totalDays > 0 ? (
                    <>
                      <div 
                        className="ratio-segment present" 
                        style={{ width: `${(attendanceSummary.presentDays / attendanceSummary.totalDays) * 100}%` }}
                        title={`Present: ${attendanceSummary.presentDays} days (${Math.round((attendanceSummary.presentDays / attendanceSummary.totalDays) * 100)}%)`}
                      ></div>
                      <div 
                        className="ratio-segment halfday" 
                        style={{ width: `${(attendanceSummary.halfDays / attendanceSummary.totalDays) * 100}%` }}
                        title={`Half days: ${attendanceSummary.halfDays} days (${Math.round((attendanceSummary.halfDays / attendanceSummary.totalDays) * 100)}%)`}
                      ></div>
                      <div 
                        className="ratio-segment overtime" 
                        style={{ width: `${(attendanceSummary.overtimeDays / attendanceSummary.totalDays) * 100}%` }}
                        title={`Overtime: ${attendanceSummary.overtimeDays} days (${Math.round((attendanceSummary.overtimeDays / attendanceSummary.totalDays) * 100)}%)`}
                      ></div>
                      <div 
                        className="ratio-segment absent" 
                        style={{ width: `${(attendanceSummary.absentDays / attendanceSummary.totalDays) * 100}%` }}
                        title={`Absent: ${attendanceSummary.absentDays} days (${Math.round((attendanceSummary.absentDays / attendanceSummary.totalDays) * 100)}%)`}
                      ></div>
                    </>
                  ) : (
                    <div className="no-data">No attendance data for this period</div>
                  )}
                </div>
                
                <div className="ratio-legend">
                  <div className="legend-item">
                    <div className="color-box present"></div>
                    <span>Present</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box halfday"></div>
                    <span>Half Day</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box overtime"></div>
                    <span>Overtime</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box absent"></div>
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-summary-data">
              <i className="bi bi-pie-chart"></i>
              <h3>No Data Available</h3>
              <p>There's no attendance data available for the selected filters.</p>
              <button className="btn btn-primary" onClick={navigateToAddAttendance}>
                <i className="bi bi-plus-lg"></i>
                <span>Record New Attendance</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Confirm Delete</h3>
              <button 
                className="close-modal"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAttendanceToDelete(null);
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this attendance record?</p>
              <p><strong>Date:</strong> {attendanceToDelete && formatDate(attendanceToDelete.date)}</p>
              <p><strong>Employee:</strong> {attendanceToDelete?.employeeName}</p>
              <p><strong>Status:</strong> {attendanceToDelete?.status}</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAttendanceToDelete(null);
                }}
              >
                <i className="bi bi-x"></i>
                <span>Cancel</span>
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash"></i>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;