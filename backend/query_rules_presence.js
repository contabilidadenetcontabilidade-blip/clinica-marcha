const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.all("SELECT id, name, value FROM scoring_rules WHERE name LIKE '%Presen%' OR name LIKE '%presen%'", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
