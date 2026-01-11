const { pool } = require('../db');

(async () => {
    try {
        console.log("Fetching all available logins...");
        // Fetch users who have a role (likely valid users) or explicitly have credentials
        const res = await pool.query(`
            SELECT id, name, username, role, password 
            FROM patients 
            WHERE role IN ('admin', 'fisio', 'aluno', 'cliente') 
            ORDER BY role, name
        `);

        if (res.rows.length === 0) {
            console.log("No logins found.");
        } else {
            console.table(res.rows.map(u => ({
                Role: u.role,
                Name: u.name,
                Username: u.username || '---',
                Password: u.password || '---',
                ID: u.id
            })));
        }

    } catch (err) {
        console.error("Error:", err);
    }
})();
