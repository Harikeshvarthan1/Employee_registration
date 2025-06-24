import axios from "axios";
import type{ Salary } from "../models/types";

// Base URL for API requests
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8081/Employee_register";
const SALARIES_ENDPOINT = `${API_BASE_URL}/api/v1/salaries`;

/**
 * Fetches all salary records from the API
 * @returns Promise with array of Salary objects
 */
export const getAllSalaries = async (): Promise<Salary[]> => {
  try {
    const response = await axios.get<Salary[]>(SALARIES_ENDPOINT);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching salary records:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch salary records. Please try again later."
    );
  }
};

/**
 * Fetches a single salary record by ID
 * @param id Salary record ID
 * @returns Promise with Salary object
 */
export const getSalaryById = async (id: number): Promise<Salary> => {
  try {
    const response = await axios.get<Salary>(`${SALARIES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching salary with ID ${id}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch salary details. Please try again later."
    );
  }
};

/**
 * Fetches all salary records for a specific employee
 * @param employeeId Employee ID
 * @returns Promise with array of Salary objects
 */
export const getSalariesByEmployeeId = async (
  employeeId: number
): Promise<Salary[]> => {
  try {
    const response = await axios.get<Salary[]>(
      `${SALARIES_ENDPOINT}/employee/${employeeId}`
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching salaries for employee ${employeeId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch employee salary records. Please try again later."
    );
  }
};

/**
 * Fetches the latest salary record for a specific employee
 * @param employeeId Employee ID
 * @returns Promise with Salary object
 */
export const getLatestSalaryByEmployeeId = async (
  employeeId: number
): Promise<Salary> => {
  try {
    const response = await axios.get<Salary>(
      `${SALARIES_ENDPOINT}/employee/${employeeId}/latest`
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Error fetching latest salary for employee ${employeeId}:`,
      error
    );
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch latest salary record. Please try again later."
    );
  }
};

/**
 * Adds a new salary record
 * @param salary Salary object without ID
 * @returns Promise with created Salary object (including ID)
 */
export const addSalary = async (
  salary: Omit<Salary, "id">
): Promise<Salary> => {
  try {
    const response = await axios.post<Salary>(SALARIES_ENDPOINT, salary);
    return response.data;
  } catch (error: any) {
    console.error("Error adding salary record:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to add salary record. Please try again later."
    );
  }
};

/**
 * Updates an existing salary record
 * @param id Salary record ID
 * @param salary Updated Salary data
 * @returns Promise with updated Salary object
 */
export const updateSalary = async (
  id: number,
  salary: Partial<Salary>
): Promise<Salary> => {
  try {
    const response = await axios.put<Salary>(
      `${SALARIES_ENDPOINT}/${id}`,
      salary
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating salary record ${id}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to update salary record. Please try again later."
    );
  }
};

/**
 * Deletes a salary record
 * @param id Salary record ID
 * @returns Promise with void
 */
export const deleteSalary = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${SALARIES_ENDPOINT}/${id}`);
  } catch (error: any) {
    console.error(`Error deleting salary record ${id}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to delete salary record. Please try again later."
    );
  }
};

/**
 * Fetches salary summary statistics (monthly totals, averages, etc.)
 * Uses a dedicated statistics endpoint that returns real data based on employees
 * @returns Promise with salary statistics
 */
export const getSalaryStatistics = async (): Promise<any> => {
  try {
    const response = await axios.get<any>(`${SALARIES_ENDPOINT}/statistics`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching salary statistics:", error);

    // Provide fallback data in case of API failure
    // This allows the dashboard to display something meaningful even if the API fails
    return {
      totalPaid: 0,
      thisMonth: 0,
      lastMonth: 0,
      recentPayments: [],
      monthlyData: [
        { name: "Jan", amount: 0 },
        { name: "Feb", amount: 0 },
        { name: "Mar", amount: 0 },
        { name: "Apr", amount: 0 },
        { name: "May", amount: 0 },
        { name: "Jun", amount: 0 },
      ],
    };
  }
};

/**
 * Process a bulk upload of salary records from CSV
 * @param formData FormData containing the CSV file
 * @returns Promise with array of created Salary objects
 */
export const bulkUploadSalaries = async (
  formData: FormData
): Promise<Salary[]> => {
  try {
    const response = await axios.post<Salary[]>(
      `${SALARIES_ENDPOINT}/bulk-upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error uploading salary records:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to bulk upload salary records. Please try again later."
    );
  }
};

/**
 * Exports salary records to CSV
 * @param filters Optional filter parameters
 * @returns Promise with blob data for CSV download
 */
export const exportSalariesToCsv = async (filters?: any): Promise<Blob> => {
  try {
    const response = await axios.get(`${SALARIES_ENDPOINT}/export`, {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error exporting salary records:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to export salary records. Please try again later."
    );
  }
};

/**
 * Utility function to download the exported CSV
 * @param data Blob data from exportSalariesToCsv
 * @param filename Name for the downloaded file
 */
export const downloadCsvFile = (
  data: Blob,
  filename = "salary-export.csv"
): void => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
