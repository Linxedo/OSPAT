const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');
const { getCachedQuestions, invalidateCache, CACHE_KEYS } = require('../../utils/cache');

exports.getQuestions = async (req, res) => {
    try {
        console.log('📥 Android Questions GET received (cached)');

        const questions = await getCachedQuestions();

        // Convert to Android format
        const androidQuestions = questions.map(q => ({
            id: q.question_id,
            question_text: q.question_text,
            answers: (q.answers || []).map(a => ({
                id: a.answer_id,
                answer_text: a.answer_text,
                score: a.score
            }))
        }));

        console.log(`Sending ${androidQuestions.length} questions from cache`);
        res.json({ success: true, questions: androidQuestions });
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).json({ success: false, message: "Server error fetching questions" });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const question_text = req.body.question_text || req.body.questionText;
        const answers = req.body.answers;

        if (!question_text) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const qResult = await client.query(
                "INSERT INTO questions (question_text, is_active) VALUES ($1, true) RETURNING question_id",
                [question_text]
            );
            const questionId = qResult.rows[0].question_id;

            if (answers && Array.isArray(answers)) {
                for (const answer of answers) {
                    const text = answer.answer_text || answer.answerText;
                    const score = answer.score ?? answer.scoreValue ?? 0;
                    await client.query(
                        "INSERT INTO question_answers (question_id, answer_text, score) VALUES ($1, $2, $3)",
                        [questionId, text, score]
                    );
                }
            }

            await client.query('COMMIT');

            // Invalidate cache to force refresh on next request
            invalidateCache(CACHE_KEYS.QUESTIONS);

            res.json({ success: true, message: "Question created", questionId });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error creating question:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question_text, answers } = req.body;

        if (!question_text) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if question exists
            const questionCheck = await client.query(
                "SELECT question_id FROM questions WHERE question_id = $1 AND is_active = true",
                [id]
            );

            if (questionCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            // Update question
            await client.query(
                "UPDATE questions SET question_text = $1 WHERE question_id = $2 AND is_active = true",
                [question_text, id]
            );

            // Delete old answers
            await client.query("DELETE FROM question_answers WHERE question_id = $1", [id]);

            // Insert new answers
            if (answers && Array.isArray(answers)) {
                for (const answer of answers) {
                    if (answer.answer_text && answer.score !== undefined) {
                        await client.query(
                            "INSERT INTO question_answers (question_id, answer_text, score) VALUES ($1, $2, $3)",
                            [id, answer.answer_text, answer.score]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            // Invalidate cache to force refresh on next request
            invalidateCache(CACHE_KEYS.QUESTIONS);

            res.json({ success: true, message: "Question updated successfully" });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error updating question:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if question exists
            const questionCheck = await client.query(
                "SELECT question_id FROM questions WHERE question_id = $1 AND is_active = true",
                [id]
            );

            if (questionCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            // Soft delete
            await client.query("UPDATE questions SET is_active = false WHERE question_id = $1", [id]);

            await client.query('COMMIT');

            // Invalidate cache to force refresh on next request
            invalidateCache(CACHE_KEYS.QUESTIONS);

            res.json({ success: true, message: "Question deleted successfully" });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error deleting question:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
