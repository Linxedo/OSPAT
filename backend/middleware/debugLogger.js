// Debug logger for settings synchronization
const debugSettings = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        if (req.path.includes('/settings') && req.method === 'POST') {
            console.log('🔧 SETTINGS UPDATE DEBUG:');
            console.log('  - Path:', req.path);
            console.log('  - Method:', req.method);
            console.log('  - Body:', JSON.stringify(req.body, null, 2));
            console.log('  - Response:', data);
        }
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = debugSettings;
