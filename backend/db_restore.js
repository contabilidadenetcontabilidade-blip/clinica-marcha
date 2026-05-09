
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');

db.serialize(() => {
    // 1. Remove Glaubert Master Admin
    db.run("DELETE FROM patients WHERE username = 'glaubert_admin'", function (err) {
        if (err) console.error("Error deleting glaubert_admin:", err.message);
        else console.log(`Removed ${this.changes} glaubert_admin user(s).`);
    });

    // 2. Restore Tamara Access
    // Set role to 'admin' (which was her coordination role) and is_admin to 0 (to avoid my new redirection logic if it still exists)
    // Actually, turn off the is_admin flag just in case.
    db.run("UPDATE patients SET role = 'admin', is_admin = 0, access_level = NULL WHERE username = 'tamara'", function (err) {
        if (err) console.error("Error restoring Tamara:", err.message);
        else console.log(`Restored ${this.changes} user (Tamara) permissions.`);
    });
});

db.close();
