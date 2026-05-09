const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('marcha.db');
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    console.log("Tables:", tables);
    db.all("PRAGMA table_info(cards)", [], (err, cols) => {
        console.log("Cards cols:", cols);
    });
});
