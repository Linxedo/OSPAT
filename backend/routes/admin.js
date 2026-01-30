const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Import controllers
const dashboardController = require('../controllers/admin/dashboardController');
const usersController = require('../controllers/admin/usersController');
const syncUsersController = require('../controllers/admin/syncUsersController');
const settingsController = require('../controllers/admin/settingsController');
const questionsController = require('../controllers/admin/questionsController');
const historyController = require('../controllers/admin/historyController');
const userAnswersController = require('../controllers/admin/userAnswersController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// DASHBOARD API
// ============================================================================
router.get('/dashboard', dashboardController.getDashboard);

// ============================================================================
// USERS API
// ============================================================================
router.get('/users', usersController.getUsers);

router.post('/users', [
    body('name').notEmpty().withMessage('Name is required'),
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('role').isIn(['admin', 'user']).withMessage('Invalid role'),
    body('password').custom((value, { req }) => {
        if (req.body.role === 'admin' && !value) {
            throw new Error('Password is required for admin users');
        }
        return true;
    })
], usersController.createUser);

router.put('/users/:id', [
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['admin', 'user']).withMessage('Invalid role'),
    body('password').optional().custom((value, { req }) => {
        if (req.body.role === 'admin' && value && value.length < 6) {
            throw new Error('Password must be at least 6 characters for admin users');
        }
        return true;
    })
], usersController.updateUser);

router.delete('/users/:id', usersController.deleteUser);

// Sync Users from External API
router.post('/sync-users', syncUsersController.syncUsers);

// ============================================================================
// SETTINGS API
// ============================================================================
router.get('/settings', settingsController.getSettings);

router.post('/settings', [
    body('minimum_passing_score').optional().isInt({ min: 0, max: 10000 }),
    body('hard_mode_threshold').optional().isInt({ min: 0, max: 10000 }),
    body('minigame_enabled').optional().isBoolean(),
    body('mg1_enabled').optional().isBoolean(),
    body('mg1_speed_normal').optional().isInt({ min: 100, max: 5000 }),
    body('mg1_speed_hard').optional().isInt({ min: 50, max: 2000 }),
    body('mg2_enabled').optional().isBoolean(),
    body('mg2_speed_normal').optional().isInt({ min: 100, max: 5000 }),
    body('mg2_speed_hard').optional().isInt({ min: 50, max: 2000 }),
    body('mg3_enabled').optional().isBoolean(),
    body('mg3_rounds').optional().isInt({ min: 1, max: 20 }),
    body('mg3_time_normal').optional().isInt({ min: 250, max: 10000 }),
    body('mg3_time_hard').optional().isInt({ min: 250, max: 5000 }),
    body('mg4_enabled').optional().isBoolean(),
    body('mg4_time_normal').optional().isInt({ min: 250, max: 10000 }),
    body('mg4_time_hard').optional().isInt({ min: 250, max: 5000 }),
    body('mg5_enabled').optional().isBoolean(),
    body('mg5_time_normal').optional().isInt({ min: 250, max: 10000 }),
    body('mg5_time_hard').optional().isInt({ min: 250, max: 5000 })
], settingsController.updateSettings);

// Server-Sent Events for Real-Time Settings Sync
router.get('/settings/stream', settingsController.streamSettings);

// ============================================================================
// QUESTIONS API
// ============================================================================
router.get('/questions', questionsController.getQuestions);

router.post('/questions', [
    body('question_text').notEmpty().withMessage('Question text is required'),
    body('answers').isArray().withMessage('Answers array is required')
], questionsController.createQuestion);

router.put('/questions/:id', [
    body('question_text').notEmpty().withMessage('Question text is required'),
    body('answers').isArray().withMessage('Answers array is required')
], questionsController.updateQuestion);

router.delete('/questions/:id', questionsController.deleteQuestion);

// ============================================================================
// HISTORY API
// ============================================================================
router.get('/history', historyController.getHistory);

// ============================================================================
// USER ANSWERS API
// ============================================================================
router.get('/user_answers/:resultId', userAnswersController.getUserAnswers);

module.exports = router;