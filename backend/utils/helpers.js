/**
 * Common helper functions to reduce code duplication
 */

const pool = require('../models/db');
const logger = require('./logger');

/**
 * Log activity to database
 * Handles errors gracefully without breaking the main flow
 */
const logActivity = async (activityType, description, userId) => {
    try {
        await pool.query(
            'INSERT INTO activity_log (activity_type, description, user_id) VALUES ($1, $2, $3)',
            [activityType, description, userId]
        );
    } catch (error) {
        // Log but don't throw - activity logging should not break main operations
        logger.warn('Activity logging failed', { 
            activityType, 
            error: error.message 
        });
    }
};

/**
 * Handle database transaction with automatic rollback on error
 */
const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Validate required environment variables
 */
const validateEnvVars = (requiredVars) => {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

/**
 * Safe parse integer with default
 */
const safeParseInt = (value, defaultValue = 0) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safe parse float with default
 */
const safeParseFloat = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Pagination helper
 */
const getPaginationParams = (query) => {
    const page = safeParseInt(query.page, 1);
    const limit = safeParseInt(query.limit, 10);
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
};

/**
 * Build pagination response
 */
const buildPaginationResponse = (page, limit, totalCount) => {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
        currentPage: page,
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

module.exports = {
    logActivity,
    withTransaction,
    validateEnvVars,
    safeParseInt,
    safeParseFloat,
    getPaginationParams,
    buildPaginationResponse
};
