/**
 * Standardized API response formatter
 * Ensures consistent response structure across all endpoints
 */

const isProd = process.env.NODE_ENV === 'production';

class ResponseFormatter {
    /**
     * Success response
     */
    success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    /**
     * Error response
     */
    error(res, message = 'Server error', statusCode = 500, error = null) {
        const response = {
            success: false,
            message
        };

        // Only include error details in development
        if (!isProd && error) {
            response.error = {
                message: error.message,
                stack: error.stack
            };
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     */
    validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: Array.isArray(errors) ? errors : [errors]
        });
    }

    /**
     * Not found response
     */
    notFound(res, resource = 'Resource') {
        return res.status(404).json({
            success: false,
            message: `${resource} not found`
        });
    }

    /**
     * Unauthorized response
     */
    unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message
        });
    }

    /**
     * Forbidden response
     */
    forbidden(res, message = 'Access forbidden') {
        return res.status(403).json({
            success: false,
            message
        });
    }
}

module.exports = new ResponseFormatter();
