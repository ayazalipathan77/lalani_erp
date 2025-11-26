/**
 * Date formatting utilities for the Lalani ERP application
 */

/**
 * Format a date string or Date object to MM-DD-YYYY HH:MM format
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return '';

        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');

        return `${month}-${day}-${year} ${hours}:${minutes}`;
    } catch (error) {
        console.warn('Date formatting error:', error);
        return '';
    }
};

/**
 * Format a date string or Date object to MM-DD-YYYY format only
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return '';

        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${month}-${day}-${year}`;
    } catch (error) {
        console.warn('Date formatting error:', error);
        return '';
    }
};

/**
 * Format a date for display in tables (handles both date and datetime)
 * @param date - Date string, Date object, or null/undefined
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string
 */
export const formatTableDate = (date: string | Date | null | undefined, includeTime: boolean = true): string => {
    return includeTime ? formatDateTime(date) : formatDate(date);
};