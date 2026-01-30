const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');

exports.getQuestions = async (req, res) => {
    try {
        console.log('Questions endpoint called');

        // Fix NULL is_active values
        await pool.query("UPDATE questions SET is_active = true WHERE is_active IS NULL");

        const questionsResult = await pool.query(
            "SELECT question_id, question_text FROM questions WHERE is_active = true ORDER BY question_id ASC"
        );

        if (questionsResult.rows.length === 0) {
            console.log('No questions found');
            return res.json({ success: true, message: "No questions available", data: [] });
        }

        const questionIds = questionsResult.rows.map(q => q.question_id);
        const answersResult = await pool.query(
            "SELECT question_id, answer_id, answer_text, score FROM question_answers WHERE question_id = ANY($1) ORDER BY answer_id ASC",
            [questionIds]
        );

        // Group answers by question
        const answersMap = answersResult.rows.reduce((acc, ans) => {
            if (!acc[ans.question_id]) acc[ans.question_id] = [];
            acc[ans.question_id].push({
                id: ans.answer_id,
                answer_text: ans.answer_text,
                score: ans.score
            });
            return acc;
        }, {});

        const questions = questionsResult.rows.map(q => ({
            id: q.question_id,
            question_text: q.question_text,
            answers: answersMap[q.question_id] || []
        }));

        console.log(`Sending ${questions.length} questions`);
        res.json({ success: true, questions });
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
