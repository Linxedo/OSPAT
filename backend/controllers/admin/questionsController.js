const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');
const { getCachedQuestions, invalidateCache, CACHE_KEYS } = require('../../utils/cache');

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

exports.getQuestions = async (req, res) => {
    try {
        console.log('📥 Questions GET received (cached)');

        const questions = await getCachedQuestions();

        res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Questions fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { question_text, answers } = req.body;

        await pool.query('BEGIN');

        const questionResult = await pool.query(
            "INSERT INTO questions (question_text, is_active) VALUES ($1, true) RETURNING question_id",
            [question_text]
        );

        const questionId = questionResult.rows[0].question_id;

        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                if (answer.answer_text && answer.score !== undefined) {
                    await pool.query(
                        "INSERT INTO question_answers (question_id, answer_text, score) VALUES ($1, $2, $3)",
                        [questionId, answer.answer_text, answer.score]
                    );
                }
            }
        }

        await pool.query('COMMIT');

        await logActivity(pool, 'question_created', `New question created: "${question_text}"`, req.user?.userId);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        const answersResult = await pool.query(
            "SELECT answer_id, answer_text, score FROM question_answers WHERE question_id = $1 ORDER BY answer_id ASC",
            [questionId]
        );

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: {
                question_id: questionId,
                question_text: question_text,
                answers: answersResult.rows
            }
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Question creation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateQuestion = async (req, res) => {
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
        const { question_text, answers } = req.body;

        await pool.query('BEGIN');

        await pool.query(
            "UPDATE questions SET question_text = $1 WHERE question_id = $2 AND is_active = true",
            [question_text, id]
        );

        await pool.query("DELETE FROM question_answers WHERE question_id = $1", [id]);

        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                if (answer.answer_text && answer.score !== undefined) {
                    await pool.query(
                        "INSERT INTO question_answers (question_id, answer_text, score) VALUES ($1, $2, $3)",
                        [id, answer.answer_text, answer.score]
                    );
                }
            }
        }

        await pool.query('COMMIT');

        await logActivity(pool, 'question_updated', `Question edited: "${question_text}"`, req.user?.userId);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        const answersResult = await pool.query(
            "SELECT answer_id, answer_text, score FROM question_answers WHERE question_id = $1 ORDER BY answer_id ASC",
            [id]
        );

        res.json({
            success: true,
            message: 'Question updated successfully',
            data: {
                question_id: parseInt(id),
                question_text: question_text,
                answers: answersResult.rows
            }
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Question update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const questionInfo = await pool.query("SELECT question_text FROM questions WHERE question_id = $1", [id]);
        const questionText = questionInfo.rows[0]?.question_text || `ID: ${id}`;

        await pool.query("UPDATE questions SET is_active = false WHERE question_id = $1", [id]);

        await logActivity(pool, 'question_deleted', `Question deleted: "${questionText}"`, req.user?.userId);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Question deletion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
