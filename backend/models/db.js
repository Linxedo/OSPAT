require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

// Validate required database environment variables
const requiredDbVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASS', 'DB_PORT'];
const missingVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    logger.error('Missing required database environment variables', null, { missing: missingVars });
    throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT, 10),
    max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
    logger.error('Unexpected database pool error', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => {
        logger.info('Database connection established successfully');
    })
    .catch((err) => {
        logger.error('Failed to connect to database', err);
        process.exit(1);
    });

module.exports = pool;
