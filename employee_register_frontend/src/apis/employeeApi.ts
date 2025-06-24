// src/apis/employeeApi.ts
import axios from 'axios';
import type { Employee, EmployeeFilterOptions } from '../models/types';

// Base URL for API calls
const API_URL = 'http://localhost:8081/Employee_register/api/v1/employees';

/**
 * Get all employees with optional filtering
 */
export const getAllEmployees = async (filters?: EmployeeFilterOptions): Promise<Employee[]> => {
  try {
    // Build query parameters based on filters
    const params = new URLSearchParams();
    if (filters?.status) {
      // If status is specifically active, use the dedicated endpoint
      if (filters.status === 'active') {
        return await getAllActiveEmployees();
      }
      params.append('status', filters.status);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.searchTerm) {
      params.append('search', filters.searchTerm);
    }

    const response = await axios.get<Employee[]>(API_URL, { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employees. Please try again later.');
  }
};

/**
 * Get all active employees
 */
export const getAllActiveEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await axios.get<Employee[]>(`${API_URL}/active`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching active employees:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch active employees. Please try again later.');
  }
};

/**
 * Get an employee by ID
 */
export const getEmployeeById = async (id: number): Promise<Employee> => {
  try {
    const response = await axios.get<Employee>(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employee details. Please try again later.');
  }
};

/**
 * Get dashboard statistics for employees
 */
export const getEmployeeStats = async () => {
    try {
      // In a real app, you would call an actual endpoint for this data
      const employees = await getAllEmployees();
      const activeEmployees = await getAllActiveEmployees();
      
      // Create sample data for recent hires (last 5 employees based on join date)
      const recentHires = [...employees]
        .sort((a, b) => {
          const dateA = new Date(a.joinDate).getTime();
          const dateB = new Date(b.joinDate).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
      
      return {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: employees.length - activeEmployees.length,
        recentHires: recentHires
      };
    } catch (error: any) {
      console.error('Error fetching employee stats:', error);
      throw new Error('Failed to fetch employee statistics');
    }
  };
  
/**
 * Add a new employee
 */
export const addEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
  try {
    // Ensure date format is correct
    const formattedData = {
      ...employeeData,
      joinDate: employeeData.joinDate instanceof Date 
        ? employeeData.joinDate 
        : new Date(employeeData.joinDate)
    };

    const response = await axios.post<Employee>(API_URL, formattedData);
    return response.data;
  } catch (error: any) {
    console.error('Error adding employee:', error);
    const errorMessage = error.response?.data?.message || 'Failed to add employee';
    throw new Error(errorMessage);
  }
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (employeeData: Employee): Promise<Employee> => {
  try {
    if (!employeeData.id) {
      throw new Error('Employee ID is required for updates');
    }

    const response = await axios.put<Employee>(`${API_URL}/${employeeData.id}`, employeeData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating employee:', error);
    const errorMessage = error.response?.data?.message || 'Failed to update employee';
    throw new Error(errorMessage);
  }
};

/**
 * Update an employee's status (active/inactive)
 */
export const updateEmployeeStatus = async (id: number, status: 'active' | 'inactive'): Promise<Employee> => {
  try {
    const response = await axios.put<Employee>(`${API_URL}/${id}/status`, status);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating status for employee ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to update employee status. Please try again later.');
  }
};

/**
 * Delete an employee by ID
 */
export const deleteEmployee = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    // The controller returns a string message, but we're just checking if it succeeded
    return response.status === 200;
  } catch (error: any) {
    console.error(`Error deleting employee ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to delete employee. Please try again later.');
  }
};

/**
 * Search employees by name (helper function)
 */
export const searchEmployeesByName = async (query: string): Promise<Employee[]> => {
  try {
    const params = new URLSearchParams({ search: query });
    const response = await axios.get<Employee[]>(API_URL, { params });
    return response.data;
  } catch (error: any) {
    console.error('Error searching employees:', error);
    throw new Error(error.response?.data?.message || 'Failed to search employees. Please try again later.');
  }
};

/**
 * Get count of active employees (helper function)
 */
export const getActiveEmployeeCount = async (): Promise<number> => {
  try {
    const employees = await getAllActiveEmployees();
    return employees.length;
  } catch (error: any) {
    console.error('Error getting active employee count:', error);
    throw new Error('Failed to get employee count. Please try again later.');
  }
};
