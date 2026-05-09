const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
db.get("SELECT id, name FROM houses WHERE name LIKE '%Cadil%'", [], (err, row) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(row));
    db.close();
});
