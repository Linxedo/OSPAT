const pool = require('../../models/db');

exports.getDashboard = async (req, res) => {
    try {
        console.log('Dashboard API called by authenticated user:', req.user);

        // Execute queries sequentially
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
        const testResultsResult = await pool.query('SELECT COUNT(*) as total FROM test_results');
        const questionsResult = await pool.query('SELECT COUNT(*) as total FROM questions');
        const recentUsersResult = await pool.query('SELECT id, name, employee_id FROM users ORDER BY id DESC LIMIT 5');
        const recentTestsResult = await pool.query('SELECT tr.result_id, tr.test_timestamp, tr.total_score, u.name as user_name FROM test_results tr JOIN users u ON tr.user_id = u.id ORDER BY tr.test_timestamp DESC LIMIT 5');

        // Get recent activities from activity_log
        let recentActivities = [];
        try {
            const activitiesResult = await pool.query(`
                SELECT al.activity_type, al.description, (al.timestamp AT TIME ZONE 'UTC') as timestamp, u.name as admin_name
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.timestamp DESC LIMIT 10
            `);
            recentActivities = activitiesResult.rows;
        } catch (activitiesError) {
            console.log('Activities tracking not available:', activitiesError.message);
        }

        const successThreshold = 80;
        const successResult = await pool.query(
            'SELECT COUNT(*) as total FROM test_results WHERE total_score >= $1',
            [successThreshold]
        );

        const successRate = testResultsResult.rows[0].total > 0
            ? Math.round((successResult.rows[0].total / testResultsResult.rows[0].total) * 100)
            : 0;

        console.log('Dashboard SUCCESS - Data loaded for user:', req.user.name);
        res.json({
            success: true,
            data: {
                totalUsers: parseInt(usersResult.rows[0].total),
                totalTestResults: parseInt(testResultsResult.rows[0].total),
                totalQuestions: parseInt(questionsResult.rows[0].total),
                successRate: successRate,
                recentUsers: recentUsersResult.rows,
                recentTests: recentTestsResult.rows,
                recentActivities: recentActivities
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error.message);
        console.error('User info:', req.user);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            details: error.message
        });
    }
};
