const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log("Iniciando migração POMO UPDATE...");

    db.run(`
        CREATE TABLE IF NOT EXISTS card_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attacker_id INTEGER NOT NULL,
            target_house_id INTEGER NOT NULL,
            card_name TEXT NOT NULL,
            status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE', 'EXECUTADO', 'CANCELADO', 'REVERTIDO'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolve_at DATETIME,
            FOREIGN KEY (attacker_id) REFERENCES patients(id),
            FOREIGN KEY (target_house_id) REFERENCES houses(id)
        )
    `, (err) => {
        if (err) console.error("Erro ao criar card_queue:", err);
        else console.log("Tabela card_queue criada com sucesso.");
    });

    // Check if column exists in pomo_records, if not add it.
    db.all("PRAGMA table_info(pomo_records)", [], (err, columns) => {
        if (err) {
            console.error(err);
            return;
        }

        const hasLastHolder = columns.some(col => col.name === 'last_pomo_holder');

        if (!hasLastHolder) {
            db.run("ALTER TABLE pomo_records ADD COLUMN last_pomo_holder INTEGER", (err2) => {
                if (err2) console.error("Erro ao adicionar last_pomo_holder:", err2);
                else console.log("Coluna last_pomo_holder adicionada à tabela pomo_records.");
            });
        } else {
            console.log("Coluna last_pomo_holder já existe em pomo_records.");
        }
    });

    console.log("Migração de esquema concluída.");
});

setTimeout(() => {
    db.close();
    console.log("Conexão fechada.");
}, 2000);
