const db = require('./db');

db.serialize(() => {
    console.log("Patching athletes table...");
    db.run("ALTER TABLE athletes ADD COLUMN is_captain BOOLEAN DEFAULT 0;", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("Erro ao adicionar is_captain:", err.message);
        } else {
            console.log("Coluna is_captain garantida.");
        }
    });

    console.log("Creating active_effects table...");
    db.run(`CREATE TABLE IF NOT EXISTS active_effects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER NOT NULL,
        effect_type TEXT NOT NULL,
        multiplier DECIMAL(10, 2) DEFAULT 1.0,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id)
      );`, (err) => {
        if (err) {
            console.error("Erro ao criar active_effects:", err.message);
        } else {
            console.log("Tabela active_effects garantida.");
            process.exit(0);
        }
    });
});
