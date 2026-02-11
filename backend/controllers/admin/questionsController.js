const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');
const { getCachedQuestions, invalidateCache, CACHE_KEYS } = require('../../utils/cache');
const logger = require('../../utils/logger');
const responseFormatter = require('../../utils/responseFormatter');
const { logActivity, withTransaction } = require('../../utils/helpers');

exports.getQuestions = async (req, res) => {
    try {
        logger.debug('Questions GET received');

        const questions = await getCachedQuestions();

        return responseFormatter.success(res, questions);
    } catch (error) {
        logger.error('Questions fetch error', error);
        return responseFormatter.error(res, 'Failed to fetch questions', 500, error);
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseFormatter.validationError(res, errors.array());
        }

        const { question_text, answers } = req.body;

        const result = await withTransaction(async (client) => {
            const questionResult = await client.query(
                "INSERT INTO questions (question_text, is_active) VALUES ($1, true) RETURNING question_id",
                [question_text]
            );

            const questionId = questionResult.rows[0].question_id;

            if (answers && Array.isArray(answers)) {
                for (const answer of answers) {
                    if (answer.answer_text && answer.score !== undefined) {
                        await client.query(
                            "INSERT INTO question_answers (question_id, answer_text, score) VALUES ($1, $2, $3)",
                            [questionId, answer.answer_text, answer.score]
                        );
                    }
                }
            }

            return questionId;
        });

        await logActivity('question_created', `New question created: "${question_text}"`, req.user?.id);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        const answersResult = await pool.query(
            "SELECT answer_id, answer_text, score FROM question_answers WHERE question_id = $1 ORDER BY answer_id ASC",
            [result]
        );

        return responseFormatter.success(res, {
            question_id: result,
            question_text: question_text,
            answers: answersResult.rows
        }, 'Question created successfully', 201);
    } catch (error) {
        logger.error('Question creation error', error);
        return responseFormatter.error(res, 'Failed to create question', 500, error);
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseFormatter.validationError(res, errors.array());
        }

        const { id } = req.params;
        const { question_text, answers } = req.body;

        await withTransaction(async (client) => {
            await client.query(
                "UPDATE questions SET question_text = $1 WHERE question_id = $2 AND is_active = true",
                [question_text, id]
            );

            await client.query("DELETE FROM question_answers WHERE question_id = $1", [id]);

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
        });

        await logActivity('question_updated', `Question edited: "${question_text}"`, req.user?.id);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        const answersResult = await pool.query(
            "SELECT answer_id, answer_text, score FROM question_answers WHERE question_id = $1 ORDER BY answer_id ASC",
            [id]
        );

        return responseFormatter.success(res, {
            question_id: parseInt(id),
            question_text: question_text,
            answers: answersResult.rows
        }, 'Question updated successfully');
    } catch (error) {
        logger.error('Question update error', error);
        return responseFormatter.error(res, 'Failed to update question', 500, error);
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const questionInfo = await pool.query("SELECT question_text FROM questions WHERE question_id = $1", [id]);
        if (questionInfo.rows.length === 0) {
            return responseFormatter.notFound(res, 'Question');
        }

        const questionText = questionInfo.rows[0].question_text;

        await pool.query("UPDATE questions SET is_active = false WHERE question_id = $1", [id]);

        await logActivity('question_deleted', `Question deleted: "${questionText}"`, req.user?.id);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.QUESTIONS);

        return responseFormatter.success(res, null, 'Question deleted successfully');
    } catch (error) {
        logger.error('Question deletion error', error);
        return responseFormatter.error(res, 'Failed to delete question', 500, error);
    }
};
