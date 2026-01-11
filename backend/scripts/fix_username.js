const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../marcha.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Try adding without UNIQUE
    db.run("ALTER TABLE patients ADD COLUMN username TEXT", (err) => {
        if (err) {
            if (!err.message.includes('duplicate column')) console.log("Add Column Error (might exist):", err.message);
        } else {
            console.log("✅ Column 'username' added.");
        }
    });

    // Add Unique Index
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_username ON patients(username)", (err) => {
        if (err) console.log("Index Error:", err.message);
        else console.log("✅ Unique Index on 'username' created.");
    });
});

setTimeout(() => db.close(), 1000);
