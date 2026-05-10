const db = require('../backend/db');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='pomos'", [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
