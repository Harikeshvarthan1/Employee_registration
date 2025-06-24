// src/apis/attendanceApi.ts
import axios from 'axios';
import type { Attendance, AttendanceSummary } from '../models/types';

// Base API URL - matches your Spring Boot configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/Employee_register';
const ATTENDANCE_API = `${API_BASE_URL}/api/v1/attendance`;

/**
 * Fetch all attendance records
 */
export const getAllAttendance = async (): Promise<Attendance[]> => {
  try {
    const response = await axios.get<Attendance[]>(ATTENDANCE_API);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    throw new Error(error.response?.data || 'Failed to fetch attendance records');
  }
};

/**
 * Get attendance records for a specific date
 * @param date - Date string in format YYYY-MM-DD
 */
export const getAttendanceByDate = async (date: string): Promise<Attendance[]> => {
  try {
    const response = await axios.get<Attendance[]>(`${ATTENDANCE_API}/date/${date}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching attendance for date ${date}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch attendance for the specified date');
  }
};

/**
 * Get attendance records for a specific employee
 * @param employeeId - Employee ID
 */
export const getAttendanceByEmployeeId = async (employeeId: number): Promise<Attendance[]> => {
  try {
    const response = await axios.get<Attendance[]>(`${ATTENDANCE_API}/employee/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching attendance for employee ${employeeId}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch attendance for the specified employee');
  }
};

/**
 * Get attendance record for a specific employee on a specific date
 * @param employeeId - Employee ID
 * @param date - Date string in format YYYY-MM-DD
 */
export const getAttendanceByEmployeeIdAndDate = async (
  employeeId: number,
  date: string
): Promise<Attendance> => {
  try {
    const response = await axios.get<Attendance>(
      `${ATTENDANCE_API}/employee/${employeeId}/date/${date}`
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching attendance for employee ${employeeId} on date ${date}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch the specified attendance record');
  }
};

/**
 * Create a new attendance record
 * @param attendance - Attendance record to create
 */
export const addAttendance = async (attendance: Omit<Attendance, 'id'>): Promise<Attendance> => {
  try {
    const response = await axios.post<Attendance>(ATTENDANCE_API, attendance);
    return response.data;
  } catch (error: any) {
    console.error('Error creating attendance record:', error);
    throw new Error(error.response?.data || 'Failed to create attendance record');
  }
};

/**
 * Update an existing attendance record
 * @param attendance - Attendance record with updated values
 */
export const updateAttendance = async (attendance: Attendance): Promise<Attendance> => {
  if (!attendance.id) {
    throw new Error('Attendance ID is required for update');
  }
  try {
    const response = await axios.put<Attendance>(
      `${ATTENDANCE_API}/${attendance.id}`,
      attendance
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating attendance record ${attendance.id}:`, error);
    throw new Error(error.response?.data || 'Failed to update attendance record');
  }
};

/**
 * Update overtime details for an attendance record
 * @param attendanceId - Attendance ID
 * @param overtimeDescription - Description of the overtime work
 * @param overtimeSalary - Overtime salary amount
 */
export const updateOvertimeDetails = async (
  attendanceId: number,
  overtimeDescription: string,
  overtimeSalary: number
): Promise<Attendance> => {
  try {
    const response = await axios.put<Attendance>(
      `${ATTENDANCE_API}/${attendanceId}/overtime`,
      { overtimeDescription, overtimeSalary }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating overtime details for attendance ${attendanceId}:`, error);
    throw new Error(error.response?.data || 'Failed to update overtime details');
  }
};

/**
 * Get monthly attendance summary for an employee
 * @param employeeId - Employee ID
 * @param month - Month (1-12)
 * @param year - Year (e.g., 2023)
 */
export const getMonthlyAttendanceSummary = async (
  employeeId: number,
  month: number,
  year: number
): Promise<AttendanceSummary> => {
  try {
    const response = await axios.get(
      `${ATTENDANCE_API}/monthly/${employeeId}/${month}/${year}`
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching monthly summary for employee ${employeeId}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch monthly attendance summary');
  }
};

/**
 * Delete an attendance record
 * @param attendanceId - Attendance ID to delete
 */
export const deleteAttendance = async (attendanceId: number): Promise<void> => {
  try {
    await axios.delete(`${ATTENDANCE_API}/${attendanceId}`);
  } catch (error: any) {
    console.error(`Error deleting attendance record ${attendanceId}:`, error);
    throw new Error(error.response?.data || 'Failed to delete attendance record');
  }
};

/**
 * Get attendance summary data for dashboard
 */
export const getAttendanceSummary = async () => {
  try {
    // For now, we'll create mock data as this specific endpoint might not exist yet
    // In a real app, you'd call an actual API endpoint for this summary data
    return {
      presentToday: 18,
      absentToday: 3,
      onLeave: 2,
      monthlyAttendance: [
        { name: 'Jan', present: 22, absent: 4, leave: 3 },
        { name: 'Feb', present: 20, absent: 5, leave: 3 },
        { name: 'Mar', present: 21, absent: 3, leave: 5 },
        { name: 'Apr', present: 19, absent: 6, leave: 4 },
        { name: 'May', present: 23, absent: 2, leave: 4 },
        { name: 'Jun', present: 21, absent: 4, leave: 5 }
      ]
    };
  } catch (error: any) {
    console.error('Error fetching attendance summary:', error);
    throw new Error('Failed to fetch attendance summary');
  }
};

/**
 * Helper function to format date for API requests
 * @param date - Date object or string
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    date = new Date(date);
  }
  return date.toISOString().split('T')[0];
};

/**
 * Check if an employee has an attendance record for a specific date
 * Useful for validation before creating a new record
 * @param employeeId - Employee ID
 * @param date - Date to check
 */
export const checkAttendanceExists = async (
  employeeId: number,
  date: string
): Promise<boolean> => {
  try {
    const formattedDate = formatDateForApi(date);
    const response = await getAttendanceByEmployeeIdAndDate(employeeId, formattedDate);
    return !!response; // Return true if response exists
  } catch (error) {
    return false; // No attendance record found
  }
};
