const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Store CSRF tokens in memory (in production, use Redis or database)
const tokenStore = new Map();

// Clean up expired tokens every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
        if (now > data.expiresAt) {
            tokenStore.delete(token);
        }
    }
}, 5 * 60 * 1000);

// Generate CSRF token
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// CSRF middleware
const csrfProtection = (req, res, next) => {
    // Skip CSRF for safe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const token = req.headers['x-csrf-token'];
    
    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing'
        });
    }

    const tokenData = tokenStore.get(token);
    
    if (!tokenData) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token'
        });
    }

    if (Date.now() > tokenData.expiresAt) {
        tokenStore.delete(token);
        return res.status(403).json({
            success: false,
            message: 'CSRF token expired'
        });
    }

    // Validate session/user binding (optional but recommended)
    if (req.user && tokenData.userId !== req.user.id) {
        tokenStore.delete(token);
        return res.status(403).json({
            success: false,
            message: 'CSRF token invalid for user'
        });
    }

    // Remove token after use (one-time use)
    tokenStore.delete(token);
    
    next();
};

// CSRF token endpoint middleware
const getCSRFToken = (req, res) => {
    const token = generateCSRFToken();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
    
    // Store token with user binding if available
    tokenStore.set(token, {
        createdAt: Date.now(),
        expiresAt,
        userId: req.user?.id || null
    });

    res.json({
        success: true,
        csrfToken: token
    });
};

module.exports = {
    csrfProtection,
    getCSRFToken
};
