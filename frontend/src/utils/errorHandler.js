/**
 * Centralized error handling utility for frontend
 */

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.map(e => e.msg || e.message).join(', ');
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
    return !error.response && error.request;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error) => {
    if (isNetworkError(error)) {
        return 'Network error. Please check your connection and try again.';
    }

    const status = error.response?.status;
    
    switch (status) {
        case 400:
            return getErrorMessage(error) || 'Invalid request. Please check your input.';
        case 401:
            return 'Your session has expired. Please login again.';
        case 403:
            return 'You do not have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 409:
            return 'A conflict occurred. The resource may already exist.';
        case 500:
            return 'Server error. Please try again later.';
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
        default:
            return getErrorMessage(error) || 'An unexpected error occurred.';
    }
};

/**
 * Log error for debugging (only in development)
 */
export const logError = (error, context = '') => {
    if (import.meta.env.DEV) {
        console.error(`[Error${context ? ` in ${context}` : ''}]`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
    }
};
