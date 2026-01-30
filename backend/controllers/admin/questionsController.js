const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');

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
        await pool.query("UPDATE questions SET is_active = true WHERE is_active IS NULL");

        const questionsResult = await pool.query("SELECT * FROM questions WHERE is_active = true ORDER BY question_id ASC");

        if (questionsResult.rows.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const questionIds = questionsResult.rows.map(q => q.question_id);

        const answersResult = await pool.query(
            "SELECT question_id, answer_id, answer_text, score FROM question_answers WHERE question_id = ANY($1) ORDER BY answer_id ASC",
            [questionIds]
        );

        const answersMap = answersResult.rows.reduce((acc, ans) => {
            if (!acc[ans.question_id]) acc[ans.question_id] = [];
            acc[ans.question_id].push(ans);
            return acc;
        }, {});

        const questions = questionsResult.rows.map(q => ({
            ...q,
            answers: answersMap[q.question_id] || []
        }));

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

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Question deletion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
