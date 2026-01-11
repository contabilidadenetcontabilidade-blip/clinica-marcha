const { pool } = require('../db');

async function fixTamara() {
    try {
        // 1. Delete any existing Tamara to avoid duplicates (safeguard)
        await pool.query("DELETE FROM patients WHERE name = 'Tamara'");

        // 2. Insert Tamara
        const res = await pool.query(`
            INSERT INTO patients (name, type, role, password, email, username, active)
            VALUES ($1, $2, $3, $4, $5, $6, 1)
            RETURNING *
        `, ['Tamara', 'Admin', 'admin', 'admin', 'tamara@marcha.com.br', 'Tamara']);

        console.log("✅ Created Tamara:", res.rows[0]);

    } catch (e) {
        console.error(e);
    }
}

fixTamara();
