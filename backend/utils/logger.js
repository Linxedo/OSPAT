/**
 * Centralized logging utility
 * Replaces console.log/error/warn with structured logging
 */

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');
    }

    _formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        if (isDev) {
            // Development: Pretty print with colors
            const colors = {
                error: '\x1b[31m', // Red
                warn: '\x1b[33m',  // Yellow
                info: '\x1b[36m',  // Cyan
                debug: '\x1b[90m', // Gray
                reset: '\x1b[0m'
            };
            const color = colors[level] || colors.reset;
            console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`, meta);
        } else {
            // Production: JSON format for log aggregation
            console.log(JSON.stringify(logEntry));
        }
    }

    error(message, error = null, meta = {}) {
        const errorMeta = error ? {
            error: {
                message: error.message,
                stack: isDev ? error.stack : undefined,
                code: error.code,
                ...meta
            }
        } : meta;
        this._formatMessage('error', message, errorMeta);
    }

    warn(message, meta = {}) {
        this._formatMessage('warn', message, meta);
    }

    info(message, meta = {}) {
        this._formatMessage('info', message, meta);
    }

    debug(message, meta = {}) {
        if (this.logLevel === 'debug' || isDev) {
            this._formatMessage('debug', message, meta);
        }
    }
}

module.exports = new Logger();
