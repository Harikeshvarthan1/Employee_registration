// src/apis/loanRegistrationApi.ts
import axios from 'axios';
import type{ LoanRegistration } from '../models/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/Employee_register';
const LOANS_API = `${API_BASE_URL}/api/v1/loans`;

/**
 * Get all loan registrations
 * @returns Promise with array of all loan registrations
 */
export const getAllLoans = async (): Promise<LoanRegistration[]> => {
  try {
    const response = await axios.get<LoanRegistration[]>(LOANS_API);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all loans:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch loan data');
  }
};

/**
 * Get only active loan registrations
 * @returns Promise with array of active loan registrations
 */
export const getActiveLoans = async (): Promise<LoanRegistration[]> => {
  try {
    const response = await axios.get<LoanRegistration[]>(`${LOANS_API}/active`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching active loans:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch active loan data');
  }
};

/**
 * Get active loans for a specific employee
 * @param employeeId - The ID of the employee
 * @returns Promise with array of active loans for the specified employee
 */
export const getActiveLoansByEmployeeId = async (employeeId: number): Promise<LoanRegistration[]> => {
  try {
    const response = await axios.get<LoanRegistration[]>(`${LOANS_API}/employee/${employeeId}/active`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching active loans for employee ${employeeId}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employee loans');
  }
};

/**
 * Get all loans for a specific employee
 * @param employeeId - The ID of the employee
 * @returns Promise with array of all loans for the specified employee
 */
export const getLoansByEmployeeId = async (employeeId: number): Promise<LoanRegistration[]> => {
  try {
    const response = await axios.get<LoanRegistration[]>(`${LOANS_API}/employee/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching loans for employee ${employeeId}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employee loans');
  }
};

/**
 * Register a new loan
 * @param loanData - The loan data to register
 * @returns Promise with the newly created loan registration
 */
export const registerLoan = async (loanData: {
  employeeId: number;
  loanAmount: number;
  reason: string;
  loanDate: string;
  status: string;
}): Promise<LoanRegistration> => {
  try {
    // Format the date properly if it's not already a string
    const formattedDate = typeof loanData.loanDate === 'object' 
      ? new Date(loanData.loanDate).toISOString().split('T')[0] 
      : loanData.loanDate;
    
    // Prepare payload ensuring employeeId is a number
    const payload = {
      employeeId: Number(loanData.employeeId),
      loanAmount: loanData.loanAmount,
      reason: loanData.reason,
      loanDate: formattedDate,
      status: loanData.status
    };
    
    console.log('Sending loan registration payload:', payload);
    
    const response = await axios.post<LoanRegistration>(LOANS_API, payload);
    console.log('Loan registration successful. Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error registering loan:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Server response status:', error.response.status);
      console.error('Server response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Request setup error:', error.message);
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.response?.data || 
      'Failed to register loan. Please check connection and try again.'
    );
  }
};

/**
 * Get a specific loan by ID
 * @param loanId - The ID of the loan to fetch
 * @returns Promise with the requested loan registration
 */
export const getLoanById = async (loanId: number): Promise<LoanRegistration> => {
  try {
    const response = await axios.get<LoanRegistration>(`${LOANS_API}/${loanId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching loan with ID ${loanId}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch loan details');
  }
};

/**
 * Update a loan's status (active/inactive)
 * @param loanId - The ID of the loan to update
 * @param status - The new status ('active' or 'inactive')
 * @returns Promise with the updated loan registration
 */
export const updateLoanStatus = async (loanId: number, status: string): Promise<LoanRegistration> => {
  try {
    console.log(`Updating loan ${loanId} status to: ${status}`);
    
    // The Spring Boot controller expects the status as plain text
    const response = await axios.put<LoanRegistration>(
      `${LOANS_API}/${loanId}/status`, 
      status, 
      {
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    );
    
    console.log('Status update successful. Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating status for loan ${loanId}:`, error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to update loan status');
  }
};

/**
 * Update loan details
 * @param loanId - The ID of the loan to update
 * @param loanData - The updated loan data
 * @returns Promise with the updated loan registration
 */
export const updateLoan = async (loanId: number, loanData: Partial<LoanRegistration>): Promise<LoanRegistration> => {
  try {
    console.log(`Updating loan ${loanId} with data:`, loanData);
    
    const response = await axios.put<LoanRegistration>(`${LOANS_API}/${loanId}`, loanData);
    console.log('Loan update successful. Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating loan ${loanId}:`, error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to update loan');
  }
};

/**
 * Delete a loan registration
 * @param loanId - The ID of the loan to delete
 * @returns Promise with void
 */
export const deleteLoan = async (loanId: number): Promise<void> => {
  try {
    console.log(`Deleting loan with ID: ${loanId}`);
    await axios.delete(`${LOANS_API}/${loanId}`);
    console.log(`Loan ${loanId} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting loan ${loanId}:`, error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to delete loan');
  }
};

/**
 * Calculate total loan amount for a specific employee
 * @param employeeId - The ID of the employee
 * @returns Promise with the total loan amount
 */
export const calculateTotalLoanForEmployee = async (employeeId: number): Promise<number> => {
  try {
    const loans = await getActiveLoansByEmployeeId(employeeId);
    return loans.reduce((total, loan) => total + loan.loanAmount, 0);
  } catch (error: any) {
    console.error(`Error calculating total loan for employee ${employeeId}:`, error);
    throw new Error('Failed to calculate total loan amount');
  }
};

/**
 * Get loan statistics for dashboard
 */
export const getLoanStatistics = async () => {
  try {
    // For now, you can use mock data since this specific endpoint might not exist yet
    // In a real app, you'd call an actual API endpoint for this summary data
    const activeLoans = await getActiveLoans();
    
    return {
      activeLoans: activeLoans.length,
      totalLoanAmount: activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
      pendingRepayments: 8, // Mock data - would come from API in real implementation
      recentLoans: activeLoans.slice(0, 4) // Get the first 4 active loans
    };
  } catch (error: any) {
    console.error('Error fetching loan statistics:', error);
    throw new Error('Failed to fetch loan statistics');
  }
};
