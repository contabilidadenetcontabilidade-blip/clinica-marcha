const db = require('./db');
const newRules = [
    { name: "[+1 Ponto] Presença", value: 1 },
    { name: "[+1 Ponto] Cor da Casa", value: 1 },
    { name: "[+1 Ponto] Story (@marchapilates)", value: 1 },
    { name: "[+1 Ponto] Carta Marombinha (Desafio Fácil)", value: 1 },
    { name: "[+2 Pontos] Reels/Feed", value: 2 },
    { name: "[+2 Pontos] Desafio de Sala", value: 2 },
    { name: "[+2 Pontos] Conversão (Indicação)", value: 2 },
    { name: "[+2 Pontos] Carta Senhorinha (Desafio Difícil)", value: 2 }
];

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER NOT NULL
    )`);

    db.run("DELETE FROM rules");

    const stmt = db.prepare("INSERT INTO rules (name, value) VALUES (?, ?)");
    for (const rule of newRules) {
        stmt.run(rule.name, rule.value);
    }
    stmt.finalize(() => {
        console.log("8 rules injected into 'rules' table.");
        process.exit();
    });
});
