const db = require('../backend/db');
db.all('SELECT * FROM scores WHERE points = 100 OR points = -100', [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
