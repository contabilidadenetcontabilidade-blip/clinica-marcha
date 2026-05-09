const db = require('../db');
db.all('PRAGMA table_info(patients)', [], (e, r) => {
    console.log('PATIENTS SCHEMA:', r);
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (e2, r2) => {
        if (r2.length > 0) {
            db.all('PRAGMA table_info(users)', [], (e3, r3) => {
                console.log('USERS SCHEMA:', r3);
                finish();
            });
        } else {
            console.log('No "users" table found.');
            finish();
        }
    });
});

function finish() {
    db.get('SELECT * FROM patients WHERE id = 9999', [], (e, r) => {
        console.log('ADMIN USER (9999):', r);
        process.exit();
    });
}
