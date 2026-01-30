const pool = require('../../models/db');

exports.login = async (req, res) => {
    const { employee_id } = req.body;

    if (!employee_id || employee_id.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Employee ID is required"
        });
    }

    try {
        const result = await pool.query(
            "SELECT id, employee_id, name, role FROM users WHERE employee_id = $1",
            [employee_id.trim()]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({
                success: true,
                message: "Login successful",
                data: user,
                token: "dummy_token_" + Date.now()
            });
        } else {
            res.status(404).json({
                success: false,
                message: "User ID tidak ditemukan"
            });
        }
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};
