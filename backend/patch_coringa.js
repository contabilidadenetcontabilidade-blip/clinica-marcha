const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Conectando ao banco:", dbPath);

db.serialize(() => {
    db.run("ALTER TABLE active_effects ADD COLUMN source_captain_id INTEGER;", (err) => {
        if (err) console.log("Source Err (Pode já existir):", err.message);
        else console.log("Added source_captain_id");
    });
    db.run("ALTER TABLE active_effects ADD COLUMN beneficiary_id INTEGER;", (err) => {
        if (err) console.log("Beneficiary Err (Pode já existir):", err.message);
        else console.log("Added beneficiary_id");
    });
});

setTimeout(() => db.close(), 1000);
