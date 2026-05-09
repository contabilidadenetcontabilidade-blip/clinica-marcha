const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Conectando ao banco:", dbPath);

db.serialize(() => {
    db.run("ALTER TABLE active_effects ADD COLUMN stolen_points_accumulator INTEGER DEFAULT 0;", (err) => {
        if (err) {
            console.log("Err (Pode já existir):", err.message);
        } else {
            console.log("Added stolen_points_accumulator");
        }
    });
});

setTimeout(() => db.close(), 1000);
