// src/apis/loanRepayApi.ts
import axios from 'axios';
import type{ LoanRepay } from '../models/types';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/Employee_register';
const LOAN_REPAY_API = `${API_BASE_URL}/api/v1/loan-repayments`;

/**
 * Get all loan repayments from the system
 * @returns Array of all repayment records
 */
export const getAllRepayments = async (): Promise<LoanRepay[]> => {
  try {
    const response = await axios.get<LoanRepay[]>(LOAN_REPAY_API);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all repayments:', error);
    throw new Error(error.response?.data || 'Failed to fetch repayment records');
  }
};

/**
 * Get loan repayments for a specific employee
 * @param employeeId - Employee ID to filter repayments
 * @returns Array of repayment records for the employee
 */
export const getRepaymentsByEmployeeId = async (employeeId: number): Promise<LoanRepay[]> => {
  try {
    const response = await axios.get<LoanRepay[]>(`${LOAN_REPAY_API}/employee/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching repayments for employee ${employeeId}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch employee repayments');
  }
};

/**
 * Get repayments for a specific loan
 * @param loanId - Loan ID to filter repayments
 * @returns Array of repayment records for the loan
 */
export const getRepaymentsByLoanId = async (loanId: number): Promise<LoanRepay[]> => {
  try {
    const response = await axios.get<LoanRepay[]>(`${LOAN_REPAY_API}/loan/${loanId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching repayments for loan ${loanId}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch loan repayments');
  }
};

/**
 * Add a new loan repayment
 * @param repayment - Repayment data to add
 * @returns The created repayment record
 */
export const addRepayment = async (repayment: {
  loanId: number;
  employeeId: number;
  repayAmount: number;
  repayDate: string;
}): Promise<LoanRepay> => {
  try {
    const response = await axios.post<LoanRepay>(LOAN_REPAY_API, repayment);
    return response.data;
  } catch (error: any) {
    console.error('Error adding repayment:', error);
    
    // Special handling for validation errors
    if (error.response?.status === 400) {
      throw new Error(error.response.data || 'Invalid repayment data');
    }
    
    // Special handling for loan not found or inactive
    if (error.response?.status === 404) {
      throw new Error('Loan not found or no longer active');
    }
    
    // Special handling when repayment would exceed loan amount
    if (error.response?.status === 422) {
      throw new Error(error.response.data || 'Repayment would exceed the loan amount');
    }
    
    throw new Error(error.response?.data || 'Failed to add repayment');
  }
};

/**
 * Update an existing loan repayment
 * @param repayment - Repayment data to update
 * @returns The updated repayment record
 */
export const updateRepayment = async (repayment: LoanRepay): Promise<LoanRepay> => {
  if (!repayment.id) {
    throw new Error('Repayment ID is required for update');
  }
  
  try {
    const response = await axios.put<LoanRepay>(
      `${LOAN_REPAY_API}/${repayment.id}`, 
      repayment
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating repayment ${repayment.id}:`, error);
    throw new Error(error.response?.data || 'Failed to update repayment');
  }
};

/**
 * Delete a loan repayment
 * @param repaymentId - ID of the repayment to delete
 */
export const deleteRepayment = async (repaymentId: number): Promise<void> => {
  try {
    await axios.delete(`${LOAN_REPAY_API}/${repaymentId}`);
  } catch (error: any) {
    console.error(`Error deleting repayment ${repaymentId}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Repayment record not found');
    }
    
    throw new Error(error.response?.data || 'Failed to delete repayment');
  }
};

/**
 * Get the total amount repaid for a specific loan
 * @param loanId - Loan ID to calculate total repayment
 * @returns Total amount repaid
 */
export const getTotalRepaidForLoan = async (loanId: number): Promise<number> => {
  try {
    // Using custom endpoint that returns the sum directly
    const response = await axios.get<number>(`${API_BASE_URL}/api/v1/loans/${loanId}/total-repaid`);
    return response.data;
  } catch (error: any) {
    console.error(`Error getting total repaid for loan ${loanId}:`, error);
    
    // Fallback: If the custom endpoint doesn't exist, calculate manually
    try {
      const repayments = await getRepaymentsByLoanId(loanId);
      return repayments.reduce((sum, repayment) => sum + repayment.repayAmount, 0);
    } catch (fallbackError) {
      console.error('Fallback calculation failed:', fallbackError);
      throw new Error('Failed to calculate total repaid amount');
    }
  }
};

/**
 * Get repayment by ID
 * @param repaymentId - ID of the repayment to fetch
 * @returns The requested repayment record
 */
export const getRepaymentById = async (repaymentId: number): Promise<LoanRepay> => {
  try {
    const response = await axios.get<LoanRepay>(`${LOAN_REPAY_API}/${repaymentId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching repayment ${repaymentId}:`, error);
    throw new Error(error.response?.data || 'Failed to fetch repayment details');
  }
};

/**
 * Format date for API requests
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise, parse and format
    date = new Date(date);
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Get repayments within a date range
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Array of repayments within the date range
 */
export const getRepaymentsByDateRange = async (
  startDate: string | Date,
  endDate: string | Date
): Promise<LoanRepay[]> => {
  const formattedStartDate = formatDateForApi(startDate);
  const formattedEndDate = formatDateForApi(endDate);
  
  try {
    const response = await axios.get<LoanRepay[]>(
      `${LOAN_REPAY_API}/date-range?start=${formattedStartDate}&end=${formattedEndDate}`
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching repayments for date range:`, error);
    
    // Fallback: Get all repayments and filter manually if endpoint doesn't exist
    try {
      const allRepayments = await getAllRepayments();
      return allRepayments.filter(repayment => {
        const repayDate = new Date(repayment.repayDate);
        const start = new Date(formattedStartDate);
        const end = new Date(formattedEndDate);
        end.setHours(23, 59, 59, 999); // Include the full end date
        
        return repayDate >= start && repayDate <= end;
      });
    } catch (fallbackError) {
      console.error('Fallback filtering failed:', fallbackError);
      throw new Error('Failed to fetch repayments for date range');
    }
  }
};

/**
 * Get summary statistics for repayments
 * This could be used for dashboard metrics or reports
 */
export const getRepaymentStatistics = async (): Promise<{
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  recentRepayments: LoanRepay[];
}> => {
  try {
    // If you have a specific endpoint for this data:
    // const response = await axios.get<RepaymentStats>(`${LOAN_REPAY_API}/statistics`);
    // return response.data;
    
    // Otherwise, calculate from all repayments:
    const repayments = await getAllRepayments();
    
    const totalAmount = repayments.reduce((sum, repay) => sum + repay.repayAmount, 0);
    const avgAmount = repayments.length > 0 ? totalAmount / repayments.length : 0;
    
    // Get 5 most recent repayments
    const recentRepayments = [...repayments]
      .sort((a, b) => new Date(b.repayDate).getTime() - new Date(a.repayDate).getTime())
      .slice(0, 5);
    
    return {
      totalCount: repayments.length,
      totalAmount,
      averageAmount: avgAmount,
      recentRepayments
    };
  } catch (error: any) {
    console.error('Error calculating repayment statistics:', error);
    throw new Error('Failed to generate repayment statistics');
  }
};

export default {
  getAllRepayments,
  getRepaymentsByEmployeeId,
  getRepaymentsByLoanId, 
  addRepayment,
  updateRepayment,
  deleteRepayment,
  getTotalRepaidForLoan,
  getRepaymentById,
  getRepaymentsByDateRange,
  getRepaymentStatistics
};
