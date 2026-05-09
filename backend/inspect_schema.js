const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error listing tables:', err.message);
            return;
        }

        if (tables.length === 0) {
            console.log('No tables found.');
            return;
        }

        let completed = 0;
        tables.forEach((table) => {
            const tableName = table.name;
            db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                if (err) {
                    console.error(`Error getting info for table ${tableName}:`, err.message);
                } else {
                    console.log(`\nTable: ${tableName}`);
                    columns.forEach((col) => {
                        console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                    });
                }
                completed++;
                if (completed === tables.length) {
                    db.close();
                }
            });
        });
    });
});
