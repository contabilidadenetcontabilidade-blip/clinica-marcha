const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../marcha.db');
const db = new sqlite3.Database(dbPath);

const housesList = [
    { name: 'Barrel', color: '#FB8C00' },
    { name: 'Cadillac', color: '#1E88E5' },
    { name: 'Chair', color: '#43A047' },
    { name: 'Joseph Pilates', color: '#8E24AA' },
    { name: 'Reformer', color: '#E53935' }
];

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function update() {
    console.log("📂 Updating SQLite Database at:", dbPath);

    try {
        // 1. Add username to patients
        try {
            await runQuery("ALTER TABLE patients ADD COLUMN username TEXT UNIQUE");
            console.log("✅ Added 'username' to patients.");
        } catch (e) {
            if (e.message.includes('duplicate column')) console.log("ℹ️  'username' column already exists.");
            else console.log("⚠️  Could not add username (might exist):", e.message);
        }

        // 2. Add patient_id to athletes
        try {
            await runQuery("ALTER TABLE athletes ADD COLUMN patient_id INTEGER REFERENCES patients(id)");
            console.log("✅ Added 'patient_id' to athletes.");
        } catch (e) {
            if (e.message.includes('duplicate column')) console.log("ℹ️  'patient_id' column already exists.");
            else console.log("⚠️  Could not add patient_id (might exist):", e.message);
        }

        // 3. Create/Ensure Houses
        // Ensure table exists first (just in case)
        await runQuery(`CREATE TABLE IF NOT EXISTS houses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            crest TEXT,
            active INTEGER DEFAULT 1
        )`);

        for (const h of housesList) {
            const existing = await getQuery("SELECT id FROM houses WHERE name = ?", [h.name]);
            if (!existing) {
                await runQuery("INSERT INTO houses (name, color, active) VALUES (?, ?, 1)", [h.name, h.color]);
                console.log(`✅ Created House: ${h.name}`);
            } else {
                console.log(`ℹ️  House exists: ${h.name}`);
            }
        }

        console.log("🏁 SQLite Update Complete.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        db.close();
    }
}

update();
