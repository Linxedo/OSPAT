const pool = require('../../models/db');

exports.getHistory = async (req, res) => {
    try {
        console.log('History API called by authenticated user:', req.user);

        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const date = req.query.date || '';
        const limit = 10;
        const offset = (page - 1) * limit;

        // Get minimum passing score with fallback
        let minPassingScore = 70;
        try {
            const minScoreResult = await pool.query(
                'SELECT setting_value::INTEGER as min_score FROM app_settings WHERE setting_key = $1',
                ['minimum_passing_score']
            );
            if (minScoreResult.rows.length > 0) {
                minPassingScore = minScoreResult.rows[0].min_score;
            }
        } catch (settingsError) {
            console.log('Settings table error, using default 70:', settingsError.message);
        }

        // Build WHERE clause for search and date
        let whereClause = 'WHERE u.role != \'admin\'';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.employee_id ILIKE $${paramIndex} OR u.nik ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (date) {
            whereClause += ` AND DATE(tr.test_timestamp) = $${paramIndex}`;
            queryParams.push(date);
            paramIndex++;
        }

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM test_results tr
            JOIN users u ON tr.user_id = u.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].total);

        // Main query with pagination and search
        const mainQuery = `
            SELECT tr.result_id, tr.test_timestamp, tr.assessment_score, 
                   tr.minigame1_score, tr.minigame2_score, tr.minigame3_score, 
                   tr.minigame4_score, tr.minigame5_score,
                   tr.total_score, u.name, u.employee_id, u.nik,
                   CASE
                       WHEN tr.total_score >= $${paramIndex} THEN 'Fit'
                       ELSE 'Unfit'
                   END AS status
            FROM test_results tr
            JOIN users u ON tr.user_id = u.id
            ${whereClause}
            ORDER BY tr.test_timestamp DESC
            LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
        `;

        const mainParams = [...queryParams, minPassingScore, limit, offset];
        const result = await pool.query(mainQuery, mainParams);

        const totalPages = Math.ceil(totalCount / limit);

        console.log('History SUCCESS - Data loaded for user:', req.user.name);
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalRecords: totalCount,
                recordsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('History error:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            details: error.message
        });
    }
};
