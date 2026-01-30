const pool = require('../../models/db');

exports.saveUserAnswers = async (req, res) => {
    try {
        const { result_id, answers } = req.body;

        if (!result_id || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "result_id and answers array are required"
            });
        }

        console.log('Saving user answers for result_id:', result_id);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const answer of answers) {
                const { question_id, question_text, user_answer } = answer;

                await client.query(
                    `INSERT INTO user_answers (result_id, question_id, question_text, user_answer, created_at) 
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [result_id, question_id, question_text, user_answer]
                );
            }

            await client.query('COMMIT');

            console.log(`Successfully saved ${answers.length} user answers`);

            res.json({
                success: true,
                message: `Successfully saved ${answers.length} answers`,
                data: {
                    result_id: result_id,
                    answers_saved: answers.length
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error saving user answers:", err);
        res.status(500).json({ success: false, message: "Server error saving user answers" });
    }
};
