const pool = require('../../models/db');
const { getCachedDashboard, invalidateCache, CACHE_KEYS } = require('../../utils/cache');

exports.getDashboard = async (req, res) => {
    try {
        console.log('Dashboard API called by authenticated user:', req.user);

        // Get cached dashboard data
        const dashboardData = await getCachedDashboard();

        console.log('Dashboard SUCCESS - Data loaded from cache for user:', req.user.name);
        res.json({
            success: true,
            data: dashboardData
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
