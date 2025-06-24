// src/models/types.ts

// Employee types
export interface Employee {
    id?: number;
    name: string;
    phoneNo: string;
    address: string;
    role: string;
    joinDate: string | Date;
    baseSalary: number;
    status: 'active' | 'inactive';
  }
  
  
  export interface EmployeeFormData {
    name: string;
    phoneNo: string;
    address: string;
    role: string;
    joinDate: string;
    baseSalary: number;
    status: 'active' | 'inactive';
  }
  
  export interface EmployeeFilterOptions {
    status?: 'active' | 'inactive';
    role?: string;
    searchTerm?: string;
  }
  
  // Attendance types
  export interface Attendance {
    id?: number;
    employeeId: number;
    date: string | Date;
    status: 'present' | 'absent' | 'overtime' | 'halfday';
    overtimeDescription?: string;
    overtimeSalary?: number;
    overtimeHours?: number; // NEW: Added overtime hours field
    description?: string;
    totalSalary?: number;
    employeeName?: string; // For display purposes, not in backend
  }
  
  export interface AttendanceFormData {
    employeeId: number;
    date: string;
    status: 'present' | 'absent' | 'overtime' | 'halfday';
    overtimeDescription?: string;
    overtimeSalary?: number;
    overtimeHours?: number; // NEW: Added overtime hours field
    description?: string;
  }
  
  export interface AttendanceFilterOptions {
    employeeId?: number;
    date?: string;
    status?: 'present' | 'absent' | 'overtime' | 'halfday';
    month?: number;
    year?: number;
  }
  
  export interface AttendanceSummary {
    employeeId: number;
    month: number;
    year: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    overtimeDays: number;
    totalDays: number;
    totalSalary: number;
    totalOvertimeSalary: number;
    totalOvertimeHours: number; // NEW: Added total overtime hours field
  }
  
  // Salary types
  export interface Salary {
    id?: number;
    employeeId: number;
    datePaid: string | Date;
    paymentType: 'daily_credit' | 'salary';
    amount: number;
    lastSalaryDate?: string | Date;
    employeeName?: string; // For display purposes, not in backend
  }
  
  export interface SalaryFormData {
    employeeId: number;
    datePaid: string;
    paymentType: 'daily_credit' | 'salary';
    amount: number;
    lastSalaryDate?: string;
  }
  
  export interface SalaryFilterOptions {
    employeeId?: number;
    paymentType?: 'daily_credit' | 'salary';
    startDate?: string;
    endDate?: string;
  }
  
  // Loan Registration types
  export interface LoanRegistration {
    loanId?: number;
    employeeId: number;
    loanDate: string | Date;
    loanAmount: number;
    reason: string;
    status: 'active' | 'inactive';
    employeeName?: string; // For display purposes, not in backend
    remainingAmount?: number; // Calculated field, not in backend
  }
  
  export interface LoanRegistrationFormData {
    employeeId: number;
    loanDate: string;
    loanAmount: number;
    reason: string;
    status: 'active' | 'inactive';
  }

  export interface LoanWithRepaymentInfo extends LoanRegistration {
    employeeName: string;
    repaidAmount: number;
    remainingAmount: number;
    repaymentPercentage: number;
  }
  
  
  export interface LoanFilterOptions {
    employeeId?: number;
    status?: 'active' | 'inactive';
    startDate?: string;
    endDate?: string;
    minAmount?: number;
  }
  
  // Loan Repay types
  export interface LoanRepay {
    id?: number;
    loanId: number;
    employeeId: number;
    repayAmount: number;
    repayDate: string | Date;
    employeeName?: string; // For display purposes, not in backend
    remainingBalance?: number; // Calculated field, not in backend
  }
  
  export interface LoanRepayFormData {
    loanId: number;
    employeeId: number;
    repayAmount: number;
    repayDate: string;
  }
  
  export interface LoanRepayFilterOptions {
    loanId?: number;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }
  
  // User types
  export interface User {
    userId?: number;
    userName: string;
    password?: string; // Optional as we don't always want to expose this
    email: string;
    role: 'ADMIN' | 'USER';
  }
  
  export interface UserFormData {
    userName: string;
    password: string;
    email: string;
    role: 'ADMIN' | 'USER';
  }
  
  // Authentication types
  export interface AuthUser {
    userId: number;
    userName: string;
    email: string;
    role: 'ADMIN' | 'USER';
    token?: string;
  }
  
  export interface LoginRequest {
    userName: string;
    password: string;
  }
  
  export interface LoginResponse {
    user: AuthUser;
    token: string;
  }
  
  // Dashboard types
  export interface DashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalLoans: number;
    activeLoans: number;
    totalSalaryPaid: number;
    averageAttendance: number;
  }
  
  // Common types for UI components
  export interface TableColumn<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }
  
  export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  }
  
  export interface SelectOption {
    value: string | number;
    label: string;
  }
  
  export interface FormError {
    field: string;
    message: string;
  }