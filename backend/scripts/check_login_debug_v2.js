const { pool } = require('../db');

(async () => {
    try {
        console.log("Checking user 'aluno.flow2'...");
        const res = await pool.query(
            "SELECT id, name, username, email, password, role FROM patients WHERE username = 'aluno.flow2' OR name = 'Aluno Flow 2'"
        );

        console.table(res.rows);

        if (res.rows.length === 0) {
            console.log("No user found!");
        } else {
            // Check password match manually
            const user = res.rows[0];
            if (user.password !== '123') {
                console.log(`Password mismatch! Found: '${user.password}', Expected: '123'`);
            } else {
                console.log("Credentials match! (123)");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
})();
