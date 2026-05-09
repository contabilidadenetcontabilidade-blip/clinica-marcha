const db = require('../db');

const tables = [
    `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        house_id INTEGER,
        date DATE,
        status TEXT,
        UNIQUE(patient_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS competition_scoreboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        goal_reached INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS weekly_consolidation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER,
        type TEXT, -- 'RARA', 'EPICA', 'LENDARIA'
        prize_card_id INTEGER,
        winner_athlete_id INTEGER, -- Top scorer if EPICA
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS monthly_bonus_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER,
        house_goal_reached INTEGER,
        pomo_winner_athlete_id INTEGER,
        prize_card_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id)
    )`
];

async function setup() {
    for (const sql of tables) {
        await new Promise((resolve, reject) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    console.log('✅ All consolidation tables created/verified.');
    process.exit();
}

setup();
