const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../marcha.db');
const db = new sqlite3.Database(dbPath);

const rulesSeed = [
    // Positive
    { name: 'Postar no Feed 📸', value: 10, type: 'positive' },
    { name: 'Postar Stories 🤳', value: 5, type: 'positive' },
    { name: 'Vir de Uniforme 👕', value: 5, type: 'positive' },
    { name: 'Chegar no Horário ⏰', value: 2, type: 'positive' },
    { name: 'Trazer Convidado 🤝', value: 20, type: 'positive' },
    // Negative
    { name: 'Atraso > 10min 🐢', value: -5, type: 'negative' },
    { name: 'Uso de Celular na Aula 📵', value: -5, type: 'negative' },
    { name: 'Sem Uniforme 👚', value: -2, type: 'negative' },
    // Special
    { name: '1º Lugar Desafio 🥇', value: 50, type: 'special' },
    { name: '2º Lugar Desafio 🥈', value: 30, type: 'special' },
    { name: '3º Lugar Desafio 🥉', value: 15, type: 'special' },
    // Magic
    { name: 'Regra Mágica 🧙', value: 0, type: 'magic' }, // Value 0 implies admin sets it or random? Let's say manual for now or random logic elsewhere. I will put 20 as placeholder but editable.
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

async function setup() {
    console.log("🎮 Setting up Gamification at:", dbPath);

    try {
        // 1. Create Scoring Rules Table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS scoring_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                value INTEGER NOT NULL,
                type TEXT DEFAULT 'general',
                active INTEGER DEFAULT 1
            )
        `);
        console.log("✅ Table 'scoring_rules' checked.");

        // 1.1 Add 'type' column if missing
        try {
            await runQuery("ALTER TABLE scoring_rules ADD COLUMN type TEXT DEFAULT 'general'");
            console.log("✅ Added 'type' column to scoring_rules.");
        } catch (e) {
            // console.log("ℹ️  'type' column exists.");
        }

        // 2. Seed Rules
        for (const rule of rulesSeed) {
            const existing = await getQuery("SELECT id FROM scoring_rules WHERE name = ?", [rule.name]);
            if (!existing) {
                await runQuery("INSERT INTO scoring_rules (name, value, type) VALUES (?, ?, ?)", [rule.name, rule.value, rule.type]);
                console.log(`   + Added Rule: ${rule.name}`);
            }
        }

        // 3. Create Points Log Table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS house_points_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                house_id INTEGER NOT NULL REFERENCES houses(id),
                student_id INTEGER REFERENCES patients(id), -- Nullable if points are for the house directly
                rule_id INTEGER REFERENCES scoring_rules(id), -- Nullable if manual entry
                points_awarded INTEGER NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Table 'house_points_log' ready.");

        // 4. Update Houses Table to have total_points column if not exists
        // SQLite doesn't support IF NOT EXISTS for columns easily in one go, we try catch.
        try {
            await runQuery("ALTER TABLE houses ADD COLUMN score INTEGER DEFAULT 100");
            console.log("✅ Added 'score' column to houses (Default 100).");
        } catch (e) {
            // If column exists, we might want to RESET to 100 if requested (The user said "Configure... para começarem com 100")
            // To be safe, let's update all houses to 100 if the table was just created or if we want to reset.
            // But maybe we shouldn't wipe data if it exists.
            // I'll check if the column was just added. If error 'duplicate column', it exists.
            console.log("ℹ️  'score' column likely exists.");
        }

        // 5. Reset scores to 100 (as per request "Configure all... to start with 100")
        // NOTE: This wipes current progress. Proceed with caution? 
        // The user said "Agora vamos configurar... Configure todas as 5 Casas para começarem com 100".
        // This implies initialization. I will set them to 100.
        await runQuery("UPDATE houses SET score = 100 WHERE score IS NULL OR score = 0");
        // Actually, force 100? "Configure todas as 5 Casas para começarem com 100" sounds like a reset or init.
        // I will do: UPDATE houses SET score = 100; (To ensure parity with request).
        // Wait, if I do this every time I run the script, I kill progress.
        // I will make it conditional? No, let's just ensure they are at LEAST 100 or reset.
        // I will set them to 100.
        // await runQuery("UPDATE houses SET score = 100");

        console.log("✅ Gamification Setup Complete.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        db.close();
    }
}

setup();
