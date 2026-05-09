const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Marcha/database.sqlite');

const tables = ['athletes', 'patients', 'professionals', 'houses'];

db.serialize(() => {
    tables.forEach(table => {
        db.all(`PRAGMA table_info(${table})`, (err, columns) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`\nColumns for ${table}:`);
            columns.forEach(col => {
                console.log(`  ${col.name} (${col.type})`);
            });
        });
    });
});

setTimeout(() => db.close(), 2000);
