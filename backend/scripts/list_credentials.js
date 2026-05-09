const db = require('../db');

// Query patients with non-null username (credentials)
const query = `SELECT id, name, username, password FROM patients WHERE username IS NOT NULL`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Error fetching credentials:', err.message);
        process.exit(1);
    }
    if (!rows || rows.length === 0) {
        console.log('No credentials found.');
    } else {
        console.log('Credentials:');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}, Username: ${row.username}, Password: ${row.password}`);
        });
    }
    // Close DB
    db.close(() => {
        // exit
    });
});
