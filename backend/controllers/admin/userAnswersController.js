const pool = require('../../models/db');

exports.getUserAnswers = async (req, res) => {
    try {
        const { resultId } = req.params;
        console.log('Getting user answers for result ID:', resultId);

        if (!resultId || isNaN(resultId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid result ID'
            });
        }

        const answersQuery = `
            SELECT
                ua.answer_id,
                ua.question_id,
                ua.question_text,
                ua.user_answer,
                ua.created_at,
                qa.answer_text as correct_answer,
                qa.score as answer_score,
                tr.assessment_score as total_assessment_score
            FROM user_answers ua
            LEFT JOIN question_answers qa ON ua.question_id = qa.question_id
            LEFT JOIN test_results tr ON ua.result_id = tr.result_id
            WHERE ua.result_id = $1
            ORDER BY ua.question_id
        `;

        const result = await pool.query(answersQuery, [resultId]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'No answers found for this test result',
                data: {
                    resultId: parseInt(resultId),
                    totalQuestions: 0,
                    answers: []
                }
            });
        }

        const answersByQuestion = {};
        result.rows.forEach(row => {
            if (!answersByQuestion[row.question_id]) {
                answersByQuestion[row.question_id] = {
                    questionId: row.question_id,
                    questionText: row.question_text,
                    userAnswer: row.user_answer,
                    totalAssessmentScore: row.total_assessment_score,
                    possibleAnswers: []
                };
            }

            if (row.correct_answer) {
                answersByQuestion[row.question_id].possibleAnswers.push({
                    answerText: row.correct_answer,
                    score: row.answer_score,
                    isUserAnswer: row.correct_answer === row.user_answer
                });
            }
        });

        const answers = Object.values(answersByQuestion);

        console.log(`Found ${answers.length} questions answered for result ${resultId}`);

        res.json({
            success: true,
            data: {
                resultId: parseInt(resultId),
                totalQuestions: answers.length,
                answers: answers
            }
        });

    } catch (error) {
        console.error('Error getting user answers:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user answers'
        });
    }
};
