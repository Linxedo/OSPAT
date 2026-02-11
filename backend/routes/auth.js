const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseFormatter.validationError(res, errors.array());
        }

        const { employee_id, password } = req.body;

        const result = await pool.query(
            'SELECT id, name, employee_id, password FROM users WHERE employee_id = $1 AND role = $2',
            [employee_id, 'admin']
        );

        if (result.rows.length === 0) {
            return responseFormatter.unauthorized(res, 'Invalid credentials');
        }

        const user = result.rows[0];
        if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
            return responseFormatter.unauthorized(res, 'Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return responseFormatter.unauthorized(res, 'Invalid credentials');
        }

        if (!process.env.JWT_SECRET) {
            logger.error('JWT_SECRET is not set');
            return responseFormatter.error(res, 'Server configuration error', 500);
        }

        const token = jwt.sign(
            {
                id: user.id,
                employee_id: user.employee_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        return responseFormatter.success(res, {
            token,
            admin: {
                id: user.id,
                name: user.name,
                employee_id: user.employee_id
            }
        }, 'Login successful');

    } catch (error) {
        logger.error('Login error', error);
        return responseFormatter.error(res, 'Login failed', 500, error);
    }
});

router.get('/validate', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return responseFormatter.unauthorized(res, 'Access token required');
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            if (err) {
                return responseFormatter.unauthorized(res, 'Invalid or expired token');
            }

            try {
                const result = await pool.query(
                    'SELECT id, name, employee_id FROM users WHERE id = $1 AND role = $2',
                    [user.id, 'admin']
                );

                if (result.rows.length === 0) {
                    return responseFormatter.forbidden(res, 'Admin access required');
                }

                return responseFormatter.success(res, {
                    admin: result.rows[0]
                });
            } catch (error) {
                logger.error('Admin validation error', error);
                return responseFormatter.error(res, 'Token validation failed', 500, error);
            }
        });
    } catch (error) {
        logger.error('Token validation error', error);
        return responseFormatter.error(res, 'Token validation failed', 500, error);
    }
});

module.exports = router;
