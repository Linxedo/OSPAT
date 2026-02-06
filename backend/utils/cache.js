const NodeCache = require('node-cache');
const pool = require('../models/db');

// Cache configuration
const cacheConfig = {
    stdTTL: 300, // 5 minutes default TTL
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false // Performance optimization
};

// Create cache instances
const settingsCache = new NodeCache({ ...cacheConfig, stdTTL: 600 }); // 10 minutes for settings
const dashboardCache = new NodeCache({ ...cacheConfig, stdTTL: 180 }); // 3 minutes for dashboard
const questionsCache = new NodeCache({ ...cacheConfig, stdTTL: 900 }); // 15 minutes for questions

// Cache keys
const CACHE_KEYS = {
    SETTINGS: 'app_settings',
    DASHBOARD: 'dashboard_stats',
    QUESTIONS: 'questions_list',
    USER_COUNT: 'user_count',
    QUESTION_COUNT: 'question_count'
};

// Generic cache wrapper
const withCache = async (cache, key, fetchFunction, ttl) => {
    const cached = cache.get(key);
    if (cached !== undefined) {
        console.log(`🎯 Cache HIT for ${key}`);
        return cached;
    }

    console.log(`💾 Cache MISS for ${key}, fetching from DB`);
    const data = await fetchFunction();
    cache.set(key, data, ttl);
    return data;
};

// Invalidate cache by pattern
const invalidateCache = (pattern) => {
    const keys = settingsCache.keys().concat(
        dashboardCache.keys(),
        questionsCache.keys()
    ).filter(key => key.includes(pattern));

    keys.forEach(key => {
        settingsCache.del(key);
        dashboardCache.del(key);
        questionsCache.del(key);
    });

    console.log(`🗑️ Invalidated cache keys: ${keys.join(', ')}`);
};

// Settings specific cache functions
const getCachedSettings = async () => {
    return withCache(settingsCache, CACHE_KEYS.SETTINGS, async () => {
        const result = await pool.query("SELECT setting_key, setting_value FROM app_settings");

        const defaultSettings = {
            minimum_passing_score: 70,
            hard_mode_threshold: 85,
            minigame_enabled: true,
            mg1_enabled: true,
            mg1_speed_normal: 2500,
            mg1_speed_hard: 1000,
            mg1_score_hit: 50,
            mg2_enabled: true,
            mg2_rounds: 3,
            mg2_speed_normal: 2500,
            mg2_speed_hard: 1500,
            mg2_score_max: 1000,
            mg3_enabled: true,
            mg3_rounds: 5,
            mg3_time_normal: 3000,
            mg3_time_hard: 2000,
            mg3_score_round: 200,
            mg4_enabled: true,
            mg4_time_normal: 3000,
            mg4_time_hard: 2000,
            mg4_score_max: 100,
            mg5_enabled: true,
            mg5_time_normal: 3000,
            mg5_time_hard: 2000,
            mg5_score_hit: 50
        };

        const dbSettings = result.rows.reduce((acc, row) => {
            let val;
            if (row.setting_value === 'true') {
                val = true;
            } else if (row.setting_value === 'false') {
                val = false;
            } else if (!isNaN(row.setting_value) && row.setting_value !== '') {
                val = parseFloat(row.setting_value);
            } else {
                val = row.setting_value;
            }
            acc[row.setting_key] = val;
            return acc;
        }, {});

        return { ...defaultSettings, ...dbSettings };
    });
};

// Dashboard specific cache functions
const getCachedDashboard = async () => {
    return withCache(dashboardCache, CACHE_KEYS.DASHBOARD, async () => {
        // Use Promise.all for parallel execution
        const [
            usersResult,
            testResultsResult,
            questionsResult,
            recentUsersResult,
            recentTestsResult,
            successResult
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM users'),
            pool.query('SELECT COUNT(*) as total FROM test_results'),
            pool.query('SELECT COUNT(*) as total FROM questions'),
            pool.query('SELECT id, name, employee_id FROM users ORDER BY id DESC LIMIT 5'),
            pool.query(`
                SELECT tr.result_id, tr.test_timestamp, tr.total_score, u.name as user_name 
                FROM test_results tr 
                JOIN users u ON tr.user_id = u.id 
                ORDER BY tr.test_timestamp DESC LIMIT 5
            `),
            pool.query('SELECT COUNT(*) as total FROM test_results WHERE total_score >= $1', [80])
        ]);

        // Get recent activities
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

        const successRate = testResultsResult.rows[0].total > 0
            ? Math.round((successResult.rows[0].total / testResultsResult.rows[0].total) * 100)
            : 0;

        return {
            totalUsers: parseInt(usersResult.rows[0].total),
            totalTestResults: parseInt(testResultsResult.rows[0].total),
            totalQuestions: parseInt(questionsResult.rows[0].total),
            successRate: successRate,
            recentUsers: recentUsersResult.rows,
            recentTests: recentTestsResult.rows,
            recentActivities: recentActivities
        };
    });
};

// Questions specific cache functions
const getCachedQuestions = async () => {
    return withCache(questionsCache, CACHE_KEYS.QUESTIONS, async () => {
        await pool.query("UPDATE questions SET is_active = true WHERE is_active IS NULL");

        const questionsResult = await pool.query("SELECT * FROM questions WHERE is_active = true ORDER BY question_id ASC");

        if (questionsResult.rows.length === 0) {
            return [];
        }

        const questionIds = questionsResult.rows.map(q => q.question_id);

        const answersResult = await pool.query(
            "SELECT question_id, answer_id, answer_text, score FROM question_answers WHERE question_id = ANY($1) ORDER BY answer_id ASC",
            [questionIds]
        );

        const answersMap = answersResult.rows.reduce((acc, ans) => {
            if (!acc[ans.question_id]) acc[ans.question_id] = [];
            acc[ans.question_id].push(ans);
            return acc;
        }, {});

        return questionsResult.rows.map(q => ({
            ...q,
            answers: answersMap[q.question_id] || []
        }));
    });
};

module.exports = {
    getCachedSettings,
    getCachedDashboard,
    getCachedQuestions,
    invalidateCache,
    CACHE_KEYS,
    settingsCache,
    dashboardCache,
    questionsCache
};
