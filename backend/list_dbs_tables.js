const sqlite3 = require('sqlite3').verbose();

function listTables(dbPath, label) {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            console.error(`${label} Error:`, err);
        } else {
            console.log(`${label} Tables:`, rows.map(r => r.name));
        }
        db.close();
    });
}

listTables('C:\\Marcha\\database.sqlite', 'ROOT');
listTables('C:\\Marcha\\backend\\database.sqlite', 'BACKEND');
