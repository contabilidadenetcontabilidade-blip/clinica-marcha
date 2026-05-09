const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Marcha/database.sqlite');

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Tables:", tables.map(t => t.name).join(", "));
        
        tables.forEach(table => {
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`\nSchema for ${table.name}:`);
                columns.forEach(col => {
                    console.log(`  ${col.name} (${col.type})`);
                });
            });
        });
    });
});

setTimeout(() => db.close(), 2000);
