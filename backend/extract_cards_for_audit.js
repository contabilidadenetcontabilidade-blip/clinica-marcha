const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite', sqlite3.OPEN_READONLY);

const query = 'SELECT id, name, description, effect, target_type, cost_type, cost_value FROM cards ORDER BY id';

db.all(query, (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
