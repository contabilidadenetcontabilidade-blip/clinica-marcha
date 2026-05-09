const db = require('./db');

console.log("=== MIGRAÇÃO CARTAS E REGRAS 2026 ===");

db.serialize(() => {
    // 1. Tabela de Cartas (Definição do Poder)
    db.run(`CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        description TEXT,
        active INTEGER DEFAULT 1
    )`);

    // 2. Tabela de Inventário dos Alunos (Cartas com Hash Único)
    db.run(`CREATE TABLE IF NOT EXISTS student_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        card_id INTEGER NOT NULL,
        hash TEXT UNIQUE NOT NULL,
        used INTEGER DEFAULT 0,
        used_at DATETIME,
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES patients(id),
        FOREIGN KEY(card_id) REFERENCES cards(id)
    )`);

    console.log("Tabelas 'cards' e 'student_cards' verificadas.");

    // 3. Atualização das Regras de Pontuação (Meinhas)
    const rules = [
        { name: 'Presença Confirmada', value: 1 },
        { name: 'Cor da Casa (Uniforme)', value: 1 },
        { name: 'Falta sem Aviso', value: -2 },
        { name: 'Uniforme Incompleto', value: -1 },
        { name: 'Atraso (>10min)', value: -1 }, // Ajustado para inteiro/decimal compativel
        { name: 'Pomo de Ouro (10º Ponto)', value: 10 }
    ];

    const stmt = db.prepare("INSERT OR REPLACE INTO scoring_rules (name, value, active) VALUES (?, ?, 1)");

    rules.forEach(rule => {
        // Verifica se já existe pelo nome para atualizar valor ou inserir
        db.get("SELECT id FROM scoring_rules WHERE name = ?", [rule.name], (err, row) => {
            if (row) {
                db.run("UPDATE scoring_rules SET value = ? WHERE id = ?", [rule.value, row.id]);
            } else {
                db.run("INSERT INTO scoring_rules (name, value, active) VALUES (?, ?, 1)", [rule.name, rule.value]);
            }
        });
    });
    stmt.finalize();

    console.log("Regras de pontuação atualizadas.");
});
