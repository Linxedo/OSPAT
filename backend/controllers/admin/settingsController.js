const { body, validationResult } = require('express-validator');
const pool = require('../../models/db');
const { getCachedSettings, invalidateCache, CACHE_KEYS } = require('../../utils/cache');

// Helper function to log activity
const logActivity = async (pool, activityType, description, userId) => {
    try {
        await pool.query(
            'INSERT INTO activity_log (activity_type, description, user_id) VALUES ($1, $2, $3)',
            [activityType, description, userId]
        );
    } catch (error) {
        console.log('Activity logging failed:', error.message);
    }
};

// Helper function for UPSERT (INSERT or UPDATE)
const upsertSetting = async (key, value) => {
    console.log(`💾 Upserting ${key} = ${value}`);
    try {
        const result = await pool.query(
            `INSERT INTO app_settings (setting_key, setting_value) 
             VALUES ($1, $2) 
             ON CONFLICT (setting_key) 
             DO UPDATE SET setting_value = EXCLUDED.setting_value
             RETURNING setting_key, setting_value`,
            [key, value.toString()]
        );
        console.log(`✅ Saved ${key} = ${result.rows[0].setting_value}`);
        return result;
    } catch (error) {
        console.log(`⚠️ ON CONFLICT failed for ${key}, trying manual upsert:`, error.message);

        const checkResult = await pool.query(
            'SELECT setting_key FROM app_settings WHERE setting_key = $1',
            [key]
        );

        if (checkResult.rows.length > 0) {
            const updateResult = await pool.query(
                'UPDATE app_settings SET setting_value = $1 WHERE setting_key = $2 RETURNING setting_key, setting_value',
                [value.toString(), key]
            );
            console.log(`✅ Updated ${key} = ${updateResult.rows[0].setting_value}`);
            return updateResult;
        } else {
            const insertResult = await pool.query(
                'INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2) RETURNING setting_key, setting_value',
                [key, value.toString()]
            );
            console.log(`✅ Inserted ${key} = ${insertResult.rows[0].setting_value}`);
            return insertResult;
        }
    }
};

exports.getSettings = async (req, res) => {
    try {
        console.log('📥 Settings GET received (cached)');

        const settings = await getCachedSettings();

        console.log("Settings loaded from cache:", Object.keys(settings).length, "settings found");

        res.json({
            success: true,
            message: "Settings loaded successfully",
            data: settings
        });
    } catch (error) {
        console.error('Settings fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Get current settings BEFORE updates for accurate logging
        const currentSettingsResult = await pool.query('SELECT setting_key, setting_value FROM app_settings');
        const currentSettings = currentSettingsResult.rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        // Log activity only for settings that actually changed
        for (const [key, newValue] of Object.entries(req.body)) {
            if (newValue !== undefined && newValue !== null) {
                const currentValue = currentSettings[key];
                if (currentValue !== newValue.toString()) {
                    await logActivity(pool, 'setting_updated', `Setting "${key}" changed from "${currentValue || 'empty'}" to "${newValue}"`, req.user?.userId);
                }
            }
        }

        const updatePromises = [];

        // Update all settings that are provided
        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined) {
                updatePromises.push(upsertSetting(key, value));
            }
        }

        console.log(`🔄 Executing ${updatePromises.length} upsert operations...`);
        await Promise.all(updatePromises);
        console.log('✅ All updates completed successfully');

        // Broadcast real-time updates to all connected admin clients
        if (typeof global.broadcastSettingsUpdate === 'function') {
            await global.broadcastSettingsUpdate();
        }

        // Invalidate cache to force refresh on next request
        invalidateCache(CACHE_KEYS.SETTINGS);

        // Get fresh settings from cache (will fetch from DB)
        const settings = await getCachedSettings();

        const responseData = {
            minimum_passing_score: settings.minimum_passing_score || 70,
            hard_mode_threshold: settings.hard_mode_threshold || 85,
            minigame_enabled: settings.minigame_enabled || false,
            mg1_enabled: settings.mg1_enabled || false,
            mg1_speed_normal: settings.mg1_speed_normal || 2500,
            mg1_speed_hard: settings.mg1_speed_hard || 250,
            mg2_enabled: settings.mg2_enabled || false,
            mg2_speed_normal: settings.mg2_speed_normal || 2500,
            mg2_speed_hard: settings.mg2_speed_hard || 250,
            mg3_enabled: settings.mg3_enabled || false,
            mg3_rounds: settings.mg3_rounds || 5,
            mg3_time_normal: settings.mg3_time_normal || 3000,
            mg3_time_hard: settings.mg3_time_hard || 2000,
            mg4_enabled: settings.mg4_enabled || false,
            mg4_time_normal: settings.mg4_time_normal || 3000,
            mg4_time_hard: settings.mg4_time_hard || 2000,
            mg5_enabled: settings.mg5_enabled || false,
            mg5_time_normal: settings.mg5_time_normal || 3000,
            mg5_time_hard: settings.mg5_time_hard || 2000
        };

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Settings update error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.streamSettings = async (req, res) => {
    try {
        console.log('📡 SSE client connected');

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        res.write('data: ' + JSON.stringify({
            type: 'connected',
            message: 'SSE connection established'
        }) + '\n\n');

        const clientId = Date.now() + '_' + Math.random();
        if (!global.settingsClients) {
            global.settingsClients = new Map();
        }
        global.settingsClients.set(clientId, res);

        console.log(`📡 SSE client ${clientId} added. Total clients: ${global.settingsClients.size}`);

        try {
            const settings = await getCachedSettings();

            res.write('data: ' + JSON.stringify({
                type: 'settings_update',
                data: settings
            }) + '\n\n');
        } catch (error) {
            console.error('Error sending initial settings:', error);
        }

        req.on('close', () => {
            console.log(`📡 SSE client ${clientId} disconnected`);
            global.settingsClients.delete(clientId);
            console.log(`📡 Remaining clients: ${global.settingsClients.size}`);
        });

    } catch (error) {
        console.error('SSE setup error:', error);
        res.status(500).json({ success: false, message: 'SSE setup failed' });
    }
};
