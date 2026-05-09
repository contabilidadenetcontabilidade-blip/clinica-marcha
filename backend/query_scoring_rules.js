const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite', sqlite3.OPEN_READONLY);

db.all('SELECT id, name, value FROM scoring_rules ORDER BY value DESC', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
