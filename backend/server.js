require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const androidRoutes = require('./routes/android');
const uploadRoutes = require('./routes/upload');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Global settings clients for SSE
global.settingsClients = new Map();
global.androidClients = new Map();

// Make broadcast function globally available
const pool = require('./models/db');
const { getCachedSettings } = require('./utils/cache');
const { toAndroidSettings } = require('./controllers/android/settingsController');

global.broadcastSettingsUpdate = async () => {
    try {
        const settings = await getCachedSettings();
        const androidSettings = toAndroidSettings(settings);

        // Send to Web clients (original format)
        if (global.settingsClients && global.settingsClients.size > 0) {
            const webMessage = JSON.stringify({ type: 'settings_update', data: settings });

            for (const [clientId, clientRes] of global.settingsClients) {
                try {
                    clientRes.write(`data: ${webMessage}\n\n`);
                    console.log(` [SERVER] Broadcasted Web settings to client ${clientId}`);
                } catch (error) {
                    console.error(`Failed to send update to Web client ${clientId}:`, error);
                    global.settingsClients.delete(clientId);
                }
            }
        }

        // Send to Android clients (Android format)
        if (global.androidClients && global.androidClients.size > 0) {
            const androidMessage = JSON.stringify({ type: 'settings_update', data: androidSettings });

            for (const [clientId, clientRes] of global.androidClients) {
                try {
                    clientRes.write(`data: ${androidMessage}\n\n`);
                    console.log(` [SERVER] Broadcasted Android settings to client ${clientId}`);
                } catch (error) {
                    console.error(`Failed to send update to Android client ${clientId}:`, error);
                    global.androidClients.delete(clientId);
                }
            }
        }

        const totalClients = (global.settingsClients?.size || 0) + (global.androidClients?.size || 0);
        console.log(` [SERVER] Broadcasted settings update to ${totalClients} total clients`);
    } catch (error) {
        console.error('Error broadcasting settings update:', error);
    }
};

app.disable('x-powered-by');
if (isProd) {
    app.set('trust proxy', 1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(isProd ? 'combined' : 'dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 1000, // Higher limit for development
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/android', androidRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: isProd ? 'Internal server error' : err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Server running on port ${PORT}`);
});
