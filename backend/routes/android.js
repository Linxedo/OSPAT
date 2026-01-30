const express = require('express');
const { validateApiKey } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Import controllers
const authController = require('../controllers/android/authController');
const questionsController = require('../controllers/android/questionsController');
const settingsController = require('../controllers/android/settingsController');
const testResultsController = require('../controllers/android/testResultsController');
const userAnswersController = require('../controllers/android/userAnswersController');

const router = express.Router();

// RATE LIMITING
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
});

// APPLY MIDDLEWARE TO ALL ROUTES BELOW
router.use(validateApiKey);
router.use(apiLimiter);

// AUTHENTICATION
router.post("/login", authController.login);

// QUESTIONS API
router.get("/questions", questionsController.getQuestions);

router.post("/questions", questionsController.createQuestion);

router.put("/questions/:id", questionsController.updateQuestion);

router.delete("/questions/:id", questionsController.deleteQuestion);

// SETTINGS API
router.get("/settings", settingsController.getSettings);

router.post("/settings", settingsController.updateSettings);

// Server-Sent Events for Real-Time Settings Sync
router.get("/settings/stream", settingsController.streamSettings);

// TEST RESULTS API
router.post("/results", testResultsController.saveTestResults);

// USER ANSWERS API
router.post("/user-answers", userAnswersController.saveUserAnswers);

module.exports = router;