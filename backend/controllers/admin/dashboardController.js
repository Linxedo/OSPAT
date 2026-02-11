const pool = require('../../models/db');
const { getCachedDashboard, invalidateCache, CACHE_KEYS } = require('../../utils/cache');
const logger = require('../../utils/logger');
const responseFormatter = require('../../utils/responseFormatter');

exports.getDashboard = async (req, res) => {
    try {
        logger.debug('Dashboard API called', { userId: req.user?.id });

        // Get cached dashboard data
        const dashboardData = await getCachedDashboard();

        logger.debug('Dashboard data loaded', { userId: req.user?.id });
        return responseFormatter.success(res, dashboardData);
    } catch (error) {
        logger.error('Dashboard error', error, { userId: req.user?.id });
        return responseFormatter.error(res, 'Failed to load dashboard data', 500, error);
    }
};
