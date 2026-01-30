const pool = require('../../models/db');

exports.saveTestResults = async (req, res) => {
    try {
        const {
            user_id,
            assessment_score,
            minigame1_score,
            minigame2_score,
            minigame3_score,
            minigame4_score,
            minigame5_score,
            total_score
        } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const newResult = await client.query(
                `INSERT INTO test_results 
                (user_id, assessment_score, minigame1_score, minigame2_score, minigame3_score, minigame4_score, minigame5_score, total_score) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *`,
                [user_id, assessment_score, minigame1_score, minigame2_score, minigame3_score, minigame4_score || 0, minigame5_score || 0, total_score]
            );

            const resultId = newResult.rows[0].result_id;
            console.log('Test result saved with ID:', resultId);

            await client.query('COMMIT');

            res.json({
                success: true,
                data: {
                    ...newResult.rows[0],
                    result_id: resultId
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error saving test results:", err);
        res.status(500).json({ success: false, message: "Server error saving results" });
    }
};
