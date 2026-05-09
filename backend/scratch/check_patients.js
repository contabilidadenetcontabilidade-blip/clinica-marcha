const db = require('../db');
db.all('SELECT id, name FROM patients LIMIT 5', [], (e, r) => {
    console.log('PATIENTS:', r);
    process.exit();
});
