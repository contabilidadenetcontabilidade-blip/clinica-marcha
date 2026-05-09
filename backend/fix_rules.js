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
    db.run("PRAGMA foreign_keys = OFF;");
    db.run("DELETE FROM scoring_rules", (err) => {
        if (err) {
            console.error("Error deleting rules:", err);
            return process.exit(1);
        }
    });

    const stmt = db.prepare("INSERT INTO scoring_rules (name, value, description) VALUES (?, ?, ?)");
    for (const rule of newRules) {
        stmt.run(rule.name, rule.value, rule.name);
    }
    stmt.finalize(() => {
        db.run("PRAGMA foreign_keys = ON;", () => {
            console.log("Rules successfully replaced.");
            process.exit(0);
        });
    });
});
