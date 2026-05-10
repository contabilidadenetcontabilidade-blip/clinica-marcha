const db = require('../backend/db');
db.all('SELECT * FROM athletes', [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
