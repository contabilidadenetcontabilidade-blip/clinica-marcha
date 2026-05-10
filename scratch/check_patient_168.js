const db = require('../backend/db');
db.get('SELECT name FROM patients WHERE id = 168', [], (err, row) => {
    console.log(JSON.stringify(row, null, 2));
    process.exit();
});
