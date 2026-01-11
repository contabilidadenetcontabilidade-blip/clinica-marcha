const { pool } = require('../db');

(async () => {
    try {
        console.log("Searching for 'Flow' users...");
        const res = await pool.query("SELECT id, name, username, email, password, role FROM patients WHERE name ILIKE '%Flow%' OR username ILIKE '%flow%'");

        console.table(res.rows);

        if (res.rows.length === 0) {
            console.log("No user found! Creating one...");
            // Optional: Auto-fix if I'm confident, but let's just read first.
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
})();
