const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('marcha.db');
db.all("PRAGMA table_info(cards)", [], (err, rows) => {
    console.log(rows);
});
