const { pool } = require('../db');

async function checkUsers() {
    try {
        const res = await pool.query("SELECT id, name, username, role, password, email FROM patients");
        console.log("Users in DB:", res.rows);

        // Force update Tamara
        const update = await pool.query(
            "UPDATE patients SET password = 'admin', username = 'Tamara', role = 'admin' WHERE name = 'Tamara' RETURNING *"
        );
        console.log("Updated Tamara:", update.rows);

    } catch (e) {
        console.error(e);
    }
}

checkUsers();
