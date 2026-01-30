const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../../models/db');

const SALT_ROUNDS = 10;

// Helper function to log activity
const logActivity = async (pool, activityType, description, userId) => {
    try {
        await pool.query(
            'INSERT INTO activity_log (activity_type, description, user_id) VALUES ($1, $2, $3)',
            [activityType, description, userId]
        );
    } catch (error) {
        console.log('Activity logging failed:', error.message);
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = 10;
        const offset = (page - 1) * limit;

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

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].total);
        const result = await pool.query(dataQuery, queryParams);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalRecords: totalCount,
                recordsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, employee_id, role, password } = req.body;

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE employee_id = $1',
            [employee_id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }

        let hashedPassword = '';
        if (role === 'admin' && password) {
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await pool.query(
            'INSERT INTO users (name, employee_id, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, employee_id, role',
            [name, employee_id, role, hashedPassword]
        );

        await logActivity(pool, 'user_created', `New user "${name}" (${employee_id}) joined the system`, req.user?.userId);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { name, role, password } = req.body;

        const currentUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
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
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const deletedUser = userResult.rows[0];

        try {
            // Delete all related records first (if any)
            await pool.query('DELETE FROM test_results WHERE user_id = $1', [id]);
            await pool.query('DELETE FROM activity_log WHERE user_id = $1', [id]);
            
            // Then delete the user
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
        } catch (deleteError) {
            console.error('Delete error details:', deleteError);
            
            // Handle foreign key constraint violation
            if (deleteError.code === '23503') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete user. User has related records (test results, etc). Please delete related data first.'
                });
            }
            
            throw deleteError;
        }

        await logActivity(pool, 'user_deleted', `User "${deletedUser.name}" (${deletedUser.employee_id}) was removed from the system`, req.user?.userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};
