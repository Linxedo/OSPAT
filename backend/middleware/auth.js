const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return responseFormatter.unauthorized(res, 'Access token required');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return responseFormatter.unauthorized(res, 'Invalid or expired token');
        }
        req.user = user;
        next();
    });
};

const requireAdmin = async (req, res, next) => {
    try {
        // Debug logging
        logger.info('Admin check - User from token:', {
            userId: req.user?.id,
            userRole: req.user?.role,
            fullUser: req.user
        });

        const result = await pool.query(
            'SELECT id, name, employee_id, role FROM users WHERE id = $1 AND role = $2',
            [req.user.id, 'admin']
        );

        logger.info('Admin check - Database query result:', {
            rowCount: result.rows.length,
            user: result.rows[0] || null
        });

        if (result.rows.length === 0) {
            // Check what role the user actually has
            const userCheck = await pool.query(
                'SELECT id, name, employee_id, role FROM users WHERE id = $1',
                [req.user.id]
            );

            logger.error('Admin access denied - User details:', {
                userId: req.user?.id,
                actualUser: userCheck.rows[0] || null,
                expectedRole: 'admin'
            });

            return responseFormatter.forbidden(res, 'Admin access required');
        }

        req.admin = result.rows[0];
        next();
    } catch (error) {
        logger.error('Admin check error', error);
        return responseFormatter.error(res, 'Authorization check failed', 500, error);
    }
};

const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ANDROID_API_KEY;

    // Development mode: Allow requests without API key
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment && !validApiKey) {
        logger.warn('Development mode - no API key required');
        return next();
    }

    // If API key is configured in production, validate it
    if (validApiKey && (!apiKey || apiKey !== validApiKey)) {
        logger.warn('API Key validation failed', { hasKey: !!apiKey });
        return responseFormatter.unauthorized(res, 'Invalid API key');
    }

    // Allow request if no API key is configured or validation passes
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    validateApiKey
};
