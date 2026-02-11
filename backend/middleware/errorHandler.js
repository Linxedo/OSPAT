/**
 * Centralized error handling middleware
 * Catches all errors and formats consistent responses
 */

const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle validation errors from express-validator
 */
const handleValidationError = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return responseFormatter.validationError(res, errors.array());
    }
    next();
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Request error', err, {
        path: req.path,
        method: req.method,
        user: req.user?.id
    });

    // Handle known application errors
    if (err instanceof AppError) {
        return responseFormatter.error(res, err.message, err.statusCode, err);
    }

    // Handle database errors
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return responseFormatter.error(res, 'Duplicate entry', 409, err);
            case '23503': // Foreign key violation
                return responseFormatter.error(res, 'Cannot delete: related records exist', 400, err);
            case '23502': // Not null violation
                return responseFormatter.error(res, 'Required field is missing', 400, err);
            case '42P01': // Table does not exist
                return responseFormatter.error(res, 'Database configuration error', 500, err);
            case 'ECONNREFUSED':
                return responseFormatter.error(res, 'Database connection failed', 503, err);
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return responseFormatter.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return responseFormatter.unauthorized(res, 'Token expired');
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = isProd && statusCode === 500
        ? 'Internal server error'
        : err.message || 'Server error';

    return responseFormatter.error(res, message, statusCode, err);
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res) => {
    responseFormatter.error(res, 'Endpoint not found', 404);
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler,
    handleValidationError
};
