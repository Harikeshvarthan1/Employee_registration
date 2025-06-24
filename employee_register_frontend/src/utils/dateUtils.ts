/**
 * Date and formatting utilities for the Employee Management System
 * Contains functions for formatting dates, currencies, and manipulating date objects
 */

/**
 * Format currency values for display
 * @param amount Number to format as currency
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
  
  /**
   * Get month name from month number (1-12)
   * @param month Month number (1-12)
   * @returns Month name
   */
  export const getMonthName = (
    monthOrDate: number | Date | string,
    format: 'full' | 'short' = 'full'
  ): string => {
    try {
      let monthIndex: number;
      
      if (typeof monthOrDate === 'number') {
        // Adjust for 1-based month number to 0-based index
        monthIndex = monthOrDate - 1;
      } else {
        const date = new Date(monthOrDate);
        if (isNaN(date.getTime())) return 'Invalid Month';
        monthIndex = date.getMonth();
      }
      
      // Validate month index
      if (monthIndex < 0 || monthIndex > 11) return 'Invalid Month';
      
      const months = {
        full: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        short: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
      };
      
      return months[format][monthIndex];
    } catch (error) {
      console.error('Error getting month name:', error);
      return 'Invalid Month';
    }
  };
  
  /**
   * Format a date to a localized string using Intl.DateTimeFormat
   * @param date Date string or Date object
   * @param formatStyle Date format style (short, medium, long, full)
   * @param locale Locale for formatting (default: 'en-US')
   * @returns Formatted date string
   */
  export const formatDate = (
    date: string | Date | null | undefined,
    formatStyle: 'short' | 'medium' | 'long' | 'full' = 'medium',
    locale: string = 'en-US'
  ): string => {
    if (!date) return 'N/A';
  
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
      let options: Intl.DateTimeFormatOptions;
      switch (formatStyle) {
        case 'short':
          options = { year: 'numeric', month: 'numeric', day: 'numeric' };
          break;
        case 'medium':
          options = { year: 'numeric', month: 'short', day: 'numeric' };
          break;
        case 'long':
          options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
          break;
        case 'full':
          options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
          break;
      }
  
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  /**
   * Format large numbers with suffixes (K, M, B, etc.)
   * @param num Number to format
   * @returns Formatted string
   */
  export const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    
    const units = ['', 'K', 'M', 'B', 'T'];
    const order = Math.floor(Math.log10(num) / 3);
    
    const unitValue = num / Math.pow(1000, order);
    const formatted = unitValue.toFixed(1).replace(/\.0$/, '');
    
    return `${formatted}${units[order]}`;
  };
  
  /**
   * Format time duration in minutes to hours and minutes
   * @param minutes Number of minutes
   * @returns Formatted duration string
   */
  export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };
  
  /**
   * Format phone number to standard format (XXX) XXX-XXXX
   * @param phone Phone number string
   * @returns Formatted phone number
   */
  export const formatPhoneNumber = (phone: string): string => {
    if (!phone || phone.length !== 10) return phone;
    
    return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
  };
  
  /**
   * Format date to ISO 8601 format (YYYY-MM-DD)
   * @param date Date to format
   * @returns ISO formatted date string
   */
  export const formatDateToISO = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date to ISO:', error);
      return '';
    }
  };
  
  /**
   * Get current date as ISO string (YYYY-MM-DD)
   * @returns Current date in ISO format
   */
  export const getCurrentDateISO = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  
  /**
   * Add days to a date
   * @param date Base date
   * @param days Number of days to add (can be negative)
   * @returns New date with days added
   */
  export const addDays = (date: Date | string, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  /**
   * Add months to a date
   * @param date Base date
   * @param months Number of months to add (can be negative)
   * @returns New date with months added
   */
  export const addMonths = (date: Date | string, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };
  
  /**
   * Add years to a date
   * @param date Base date
   * @param years Number of years to add (can be negative)
   * @returns New date with years added
   */
  export const addYears = (date: Date | string, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  };
  
  /**
   * Calculate the difference in days between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Number of days between dates
   */
  export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Convert to UTC to avoid timezone issues
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    
    // Calculate difference in days
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.floor((utc2 - utc1) / MS_PER_DAY);
  };
  
  /**
   * Calculate the difference in months between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Number of months between dates
   */
  export const getMonthsDifference = (date1: Date | string, date2: Date | string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return (
      (d2.getFullYear() - d1.getFullYear()) * 12 +
      (d2.getMonth() - d1.getMonth())
    );
  };
  
  /**
   * Calculate the difference in years between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Number of years between dates
   */
  export const getYearsDifference = (date1: Date | string, date2: Date | string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d2.getFullYear() - d1.getFullYear();
  };
  
  /**
   * Check if a date is today
   * @param date Date to check
   * @returns True if date is today
   */
  export const isToday = (date: Date | string): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };
  
  /**
   * Check if a date is in the past
   * @param date Date to check
   * @returns True if date is in the past
   */
  export const isPastDate = (date: Date | string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  };
  
  /**
   * Check if a date is in the future
   * @param date Date to check
   * @returns True if date is in the future
   */
  export const isFutureDate = (date: Date | string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate > today;
  };
  
  /**
   * Get the first day of the month for a given date
   * @param date Date within the month
   * @returns Date object set to first day of the month
   */
  export const getFirstDayOfMonth = (date: Date | string): Date => {
    const result = new Date(date);
    result.setDate(1);
    return result;
  };
  
  /**
   * Get the last day of the month for a given date
   * @param date Date within the month
   * @returns Date object set to last day of the month
   */
  export const getLastDayOfMonth = (date: Date | string): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1);
    result.setDate(0);
    return result;
  };
  
  /**
   * Get the start of the week (Sunday) for a given date
   * @param date Date within the week
   * @param startOnMonday If true, week starts on Monday instead of Sunday
   * @returns Date object set to start of the week
   */
  export const getStartOfWeek = (date: Date | string, startOnMonday = false): Date => {
    const result = new Date(date);
    const day = result.getDay();
    
    // Calculate days to subtract to get to start of week
    const daysToSubtract = startOnMonday 
      ? (day === 0 ? 6 : day - 1) // For Monday start
      : day; // For Sunday start
    
    result.setDate(result.getDate() - daysToSubtract);
    return result;
  };
  
  /**
   * Get the end of the week (Saturday) for a given date
   * @param date Date within the week
   * @param startOnMonday If true, week ends on Sunday instead of Saturday
   * @returns Date object set to end of the week
   */
  export const getEndOfWeek = (date: Date | string, startOnMonday = false): Date => {
    const result = new Date(date);
    const day = result.getDay();
    
    // Calculate days to add to get to end of week
    const daysToAdd = startOnMonday 
      ? (7 - day) % 7 // For Monday start (ends on Sunday)
      : 6 - day; // For Sunday start (ends on Saturday)
    
    result.setDate(result.getDate() + daysToAdd);
    return result;
  };
  
  /**
   * Check if a string is a valid date
   * @param dateStr String to validate as date
   * @returns True if string is a valid date
   */
  export const isValidDateString = (dateStr: string): boolean => {
    // Check if it matches YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };
  
  /**
   * Get an array of dates between start and end dates (inclusive)
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of Date objects
   */
  export const getDatesBetween = (startDate: Date | string, endDate: Date | string): Date[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }
    
    const dates = [];
    let currentDate = new Date(start);
    
    // Remove time part to avoid DST issues
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };
  
  /**
   * Generate an array of months as options for select inputs
   * @param format Format of month labels (numeric, short, full)
   * @returns Array of month options with value and label
   */
  export const getMonthOptions = (
    format: 'numeric' | 'short' | 'full' = 'full'
  ): Array<{ value: number, label: string }> => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      let label: string;
      
      switch (format) {
        case 'numeric':
          label = monthNum.toString().padStart(2, '0');
          break;
        case 'short':
          label = getMonthName(monthNum, 'short');
          break;
        case 'full':
        default:
          label = getMonthName(monthNum, 'full');
          break;
      }
      
      return { value: monthNum, label };
    });
  };
  
  /**
   * Generate an array of years as options for select inputs
   * @param startYear Starting year (default: 5 years ago)
   * @param endYear Ending year (default: 5 years from now)
   * @returns Array of year options with value and label
   */
  export const getYearOptions = (
    startYear?: number, 
    endYear?: number
  ): Array<{ value: number, label: string }> => {
    const currentYear = new Date().getFullYear();
    const start = startYear || currentYear - 5;
    const end = endYear || currentYear + 5;
    
    return Array.from(
      { length: end - start + 1 },
      (_, i) => {
        const year = start + i;
        return { value: year, label: year.toString() };
      }
    );
  };
  
  /**
   * Format a date as a relative time string (e.g., "2 days ago", "in 3 months")
   * @param date Date to format
   * @returns Relative time string
   */
  export const formatRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
    const absSeconds = Math.abs(diffInSeconds);
    
    // Helper function to pluralize units
    const pluralize = (count: number, unit: string) => count === 1 ? unit : `${unit}s`;
    
    // Format based on time difference
    if (absSeconds < 60) {
      // Less than a minute
      return diffInSeconds >= 0 ? 'in a few seconds' : 'a few seconds ago';
    } else if (absSeconds < 3600) {
      // Less than an hour
      const minutes = Math.floor(absSeconds / 60);
      return diffInSeconds >= 0
        ? `in ${minutes} ${pluralize(minutes, 'minute')}`
        : `${minutes} ${pluralize(minutes, 'minute')} ago`;
    } else if (absSeconds < 86400) {
      // Less than a day
      const hours = Math.floor(absSeconds / 3600);
      return diffInSeconds >= 0
        ? `in ${hours} ${pluralize(hours, 'hour')}`
        : `${hours} ${pluralize(hours, 'hour')} ago`;
    } else if (absSeconds < 2592000) {
      // Less than a month
      const days = Math.floor(absSeconds / 86400);
      return diffInSeconds >= 0
        ? `in ${days} ${pluralize(days, 'day')}`
        : `${days} ${pluralize(days, 'day')} ago`;
    } else if (absSeconds < 31536000) {
      // Less than a year
      const months = Math.floor(absSeconds / 2592000);
      return diffInSeconds >= 0
        ? `in ${months} ${pluralize(months, 'month')}`
        : `${months} ${pluralize(months, 'month')} ago`;
    } else {
      // More than a year
      const years = Math.floor(absSeconds / 31536000);
      return diffInSeconds >= 0
        ? `in ${years} ${pluralize(years, 'year')}`
        : `${years} ${pluralize(years, 'year')} ago`;
    }
  };
  
  export default {
    formatCurrency,
    formatDate,
    formatNumber,
    formatDuration,
    formatPhoneNumber,
    formatDateToISO,
    getCurrentDateISO,
    getMonthName,
    addDays,
    addMonths,
    addYears,
    getDaysDifference,
    getMonthsDifference,
    getYearsDifference,
    isToday,
    isPastDate,
    isFutureDate,
    getFirstDayOfMonth,
    getLastDayOfMonth,
    getStartOfWeek,
    getEndOfWeek,
    isValidDateString,
    getDatesBetween,
    getMonthOptions,
    getYearOptions,
    formatRelativeTime
  };
  