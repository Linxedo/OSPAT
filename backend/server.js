require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { validateEnvVars } = require('./utils/helpers');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const androidRoutes = require('./routes/android');
const uploadRoutes = require('./routes/upload');

// Validate required environment variables
try {
    validateEnvVars(['JWT_SECRET']);
    logger.info('Environment variables validated');
} catch (error) {
    logger.error('Environment validation failed', error);
    process.exit(1);
}

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
                    logger.debug(`Broadcasted Web settings to client ${clientId}`);
                } catch (error) {
                    logger.warn(`Failed to send update to Web client ${clientId}`, { error: error.message });
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
                    logger.debug(`Broadcasted Android settings to client ${clientId}`);
                } catch (error) {
                    logger.warn(`Failed to send update to Android client ${clientId}`, { error: error.message });
                    global.androidClients.delete(clientId);
                }
            }
        }

        const totalClients = (global.settingsClients?.size || 0) + (global.androidClients?.size || 0);
        logger.debug(`Broadcasted settings update to ${totalClients} total clients`);
    } catch (error) {
        logger.error('Error broadcasting settings update', error);
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
    max: 1000, // Adjusted for shared WiFi (many users strictly sharing 1 IP)
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

// Serve frontend static files in production
if (isProd) {
    const frontendPath = path.join(__dirname, 'dist');
    app.use(express.static(frontendPath));

    // Handle React Router - all non-API routes serve index.html
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`API Server running on port ${PORT}`, { 
        env: process.env.NODE_ENV || 'development',
        port: PORT 
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});
