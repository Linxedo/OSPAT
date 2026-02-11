const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../../models/db');
const logger = require('../../utils/logger');
const responseFormatter = require('../../utils/responseFormatter');
const { logActivity, getPaginationParams, buildPaginationResponse } = require('../../utils/helpers');

const SALT_ROUNDS = 10;

exports.getUsers = async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const search = req.query.search || '';

        let countQuery = 'SELECT COUNT(*) as total FROM users';
        let dataQuery = 'SELECT id, name, employee_id, role FROM users';
        let queryParams = [];
        let countParams = [];

        if (search) {
            countQuery += ' WHERE (name ILIKE $1 OR employee_id ILIKE $1)';
            dataQuery += ' WHERE (name ILIKE $1 OR employee_id ILIKE $1)';
            countParams.push(`%${search}%`);
            queryParams.push(`%${search}%`);
        }

        dataQuery += ' ORDER BY CASE WHEN role = \'admin\' THEN 0 ELSE 1 END, name ASC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        const [countResult, result] = await Promise.all([
            pool.query(countQuery, countParams),
            pool.query(dataQuery, queryParams)
        ]);

        const totalCount = parseInt(countResult.rows[0].total);

        // Maintain backward compatibility: frontend expects data as array, pagination as separate field
        return res.json({
            success: true,
            data: result.rows,
            pagination: buildPaginationResponse(page, limit, totalCount)
        });
    } catch (error) {
        logger.error('Users fetch error', error);
        return responseFormatter.error(res, 'Failed to fetch users', 500, error);
    }
};

exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseFormatter.validationError(res, errors.array());
        }

        const { name, employee_id, role, password } = req.body;

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE employee_id = $1',
            [employee_id]
        );

        if (existingUser.rows.length > 0) {
            return responseFormatter.error(res, 'Employee ID already exists', 400);
        }

        let hashedPassword = '';
        if (role === 'admin' && password) {
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await pool.query(
            'INSERT INTO users (name, employee_id, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, employee_id, role',
            [name, employee_id, role, hashedPassword]
        );

        await logActivity('user_created', `New user "${name}" (${employee_id}) joined the system`, req.user?.id);

        return responseFormatter.success(res, result.rows[0], 'User created successfully', 201);
    } catch (error) {
        logger.error('User creation error', error);
        return responseFormatter.error(res, 'Failed to create user', 500, error);
    }
};

exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseFormatter.validationError(res, errors.array());
        }

        const { id } = req.params;
        const { name, role, password } = req.body;

        const currentUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return responseFormatter.notFound(res, 'User');
        }

        const currentRole = currentUser.rows[0].role;
        let updateQuery = 'UPDATE users SET name = $1, role = $2';
        let queryParams = [name, role];

        if ((role === 'admin' || currentRole === 'admin') && password) {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            updateQuery += ', password = $3 WHERE id = $4 RETURNING id, name, employee_id, role';
            queryParams.push(hashedPassword, id);
        } else {
            updateQuery += ' WHERE id = $3 RETURNING id, name, employee_id, role';
            queryParams.push(id);
        }

        const result = await pool.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return responseFormatter.notFound(res, 'User');
        }

        return responseFormatter.success(res, result.rows[0], 'User updated successfully');
    } catch (error) {
        logger.error('User update error', error);
        return responseFormatter.error(res, 'Failed to update user', 500, error);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userResult = await pool.query(
            'SELECT name, employee_id, role FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return responseFormatter.notFound(res, 'User');
        }

        const deletedUser = userResult.rows[0];

        try {
            // Delete all related records first (if any)
            await pool.query('DELETE FROM test_results WHERE user_id = $1', [id]);
            await pool.query('DELETE FROM activity_log WHERE user_id = $1', [id]);

            // Then delete the user
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
        } catch (deleteError) {
            logger.error('Delete error details', deleteError);

            // Handle foreign key constraint violation
            if (deleteError.code === '23503') {
                return responseFormatter.error(res,
                    'Cannot delete user. User has related records. Please delete related data first.',
                    400,
                    deleteError
                );
            }

            throw deleteError;
        }

        await logActivity('user_deleted', `User "${deletedUser.name}" (${deletedUser.employee_id}) was removed from the system`, req.user?.id);

        return responseFormatter.success(res, null, 'User deleted successfully');
    } catch (error) {
        logger.error('User deletion error', error);
        return responseFormatter.error(res, 'Failed to delete user', 500, error);
    }
};
