const pool = require('../../models/db');
const { getCachedSettings, invalidateCache, CACHE_KEYS } = require('../../utils/cache');

// Helper to normalize Android naming to backend naming
const normalizeSettings = (settings) => {
    // Explicitly map every field to avoid any spread issues or missing keys
    const normalized = {
        minimum_passing_score: settings.minimum_passing_score,
        hard_mode_threshold: settings.hard_mode_threshold,

        // Minigame 1
        mg1_enabled: settings.minigame1_enabled !== undefined ? settings.minigame1_enabled : settings.mg1_enabled,
        mg1_speed_normal: settings.mg1_speed_normal,
        mg1_speed_hard: settings.mg1_speed_hard,

        // Minigame 2
        mg2_enabled: settings.minigame2_enabled !== undefined ? settings.minigame2_enabled : settings.mg2_enabled,
        mg2_rounds: settings.mg2_rounds,
        mg2_speed_normal: settings.mg2_speed_normal,
        mg2_speed_hard: settings.mg2_speed_hard,

        // Minigame 3
        mg3_enabled: settings.minigame3_enabled !== undefined ? settings.minigame3_enabled : settings.mg3_enabled,
        mg3_rounds: settings.mg3_rounds,
        mg3_time_normal: settings.mg3_time_normal,
        mg3_time_hard: settings.mg3_time_hard,

        // Minigame 4
        mg4_enabled: settings.minigame4_enabled !== undefined ? settings.minigame4_enabled : settings.mg4_enabled,
        mg4_time_normal: settings.mg4_time_normal,
        mg4_time_hard: settings.mg4_time_hard,

        // Minigame 5
        mg5_enabled: settings.minigame5_enabled !== undefined ? settings.minigame5_enabled : settings.mg5_enabled,
        mg5_time_normal: settings.mg5_time_normal,
        mg5_time_hard: settings.mg5_time_hard,
        // Scores
        mg1_score_hit: settings.mg1_score_hit,
        mg2_score_max: settings.mg2_score_max,
        mg3_score_round: settings.mg3_score_round,
        mg4_score_max: settings.mg4_score_max,
        mg5_score_hit: settings.mg5_score_hit
    };

    return normalized;
};

// Helper to convert backend naming to Android naming
const toAndroidSettings = (settings) => {
    // Explicitly map every field expected by the Android app
    const android = {
        minimum_passing_score: settings.minimum_passing_score,
        hard_mode_threshold: settings.hard_mode_threshold,

        // Minigame 1
        minigame1_enabled: settings.mg1_enabled,
        mg1_speed_normal: settings.mg1_speed_normal,
        mg1_speed_hard: settings.mg1_speed_hard,

        // Minigame 2
        minigame2_enabled: settings.mg2_enabled,
        mg2_rounds: settings.mg2_rounds,
        mg2_speed_normal: settings.mg2_speed_normal,
        mg2_speed_hard: settings.mg2_speed_hard,

        // Minigame 3
        minigame3_enabled: settings.mg3_enabled,
        mg3_rounds: settings.mg3_rounds,
        mg3_time_normal: settings.mg3_time_normal,
        mg3_time_hard: settings.mg3_time_hard,

        // Minigame 4
        minigame4_enabled: settings.mg4_enabled,
        mg4_time_normal: settings.mg4_time_normal,
        mg4_time_hard: settings.mg4_time_hard,

        // Minigame 5
        minigame5_enabled: settings.mg5_enabled,
        mg5_time_normal: settings.mg5_time_normal,
        mg5_time_hard: settings.mg5_time_hard,
        // Scores
        mg1_score_hit: parseInt(settings.mg1_score_hit) || 50,
        mg2_score_max: parseInt(settings.mg2_score_max) || 1000,
        mg3_score_round: parseInt(settings.mg3_score_round) || 200,
        mg4_score_max: parseInt(settings.mg4_score_max) || 100,
        mg5_score_hit: parseInt(settings.mg5_score_hit) || 50
    };

    return android;
};

// Helper to save app settings
async function saveAppSettings(settings) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const [key, value] of Object.entries(settings)) {
            await client.query(
                `INSERT INTO app_settings (setting_key, setting_value) 
                 VALUES ($1, $2) 
                 ON CONFLICT (setting_key) 
                 DO UPDATE SET setting_value = $2`,
                [key, value.toString()]
            );
        }

        await client.query('COMMIT');
        console.log('Settings saved successfully:', Object.keys(settings).length, 'settings');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving settings:', err);
        throw err;
    } finally {
        client.release();
    }
}

exports.getSettings = async (req, res) => {
    try {
        console.log('📥 Android Settings GET received (cached)');

        const settings = await getCachedSettings();

        // Use the proper conversion function
        const androidSettings = toAndroidSettings(settings);

        console.log('📱 Android settings sent:', Object.keys(androidSettings));

        res.json({
            success: true,
            message: "Settings loaded successfully",
            data: androidSettings
        });
    } catch (error) {
        console.error('Android Settings fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        // Normalize Android naming to backend naming
        const processedSettings = normalizeSettings(req.body);

        await saveAppSettings(processedSettings);

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.SETTINGS);

        // Broadcast updates if function exists
        if (typeof global.broadcastSettingsUpdate === 'function') {
            await global.broadcastSettingsUpdate();
        }

        res.json({ success: true, message: "Settings saved successfully" });
    } catch (err) {
        console.error("Error saving settings:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.streamSettings = async (req, res) => {
    try {
        console.log('📡 Android SSE client connected');

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const clientId = Date.now() + '_' + Math.random();
        if (!global.androidClients) {
            global.androidClients = new Map();
        }
        global.androidClients.set(clientId, res);

        console.log(`📡 Android SSE client ${clientId} added. Total Android clients: ${global.androidClients.size}`);

        // Send initial settings to Android client
        try {
            const settings = await getCachedSettings();
            const androidSettings = toAndroidSettings(settings);

            res.write('data: ' + JSON.stringify({
                type: 'settings_update',
                data: androidSettings
            }) + '\n\n');

            console.log('📱 Initial settings sent to Android client');
        } catch (error) {
            console.error('Error sending initial settings to Android:', error);
        }

        req.on('close', () => {
            console.log(`📡 Android SSE client ${clientId} disconnected`);
            global.androidClients.delete(clientId);
            console.log(`📡 Remaining Android clients: ${global.androidClients.size}`);
        });

    } catch (error) {
        console.error('Android SSE setup error:', error);
        res.status(500).json({ success: false, message: 'SSE setup failed' });
    }
};

// Export helper functions for use in other modules
exports.toAndroidSettings = toAndroidSettings;
