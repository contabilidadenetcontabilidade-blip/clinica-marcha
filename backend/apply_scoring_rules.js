const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

const inserts = [
    { name: '[+3 Pontos] Evolução Técnica', value: 3 },
    { name: '[+3 Pontos] Indicação Aula Experimental', value: 3 },
    { name: '[-2 Pontos] Falta sem Justificativa', value: -2 },
    { name: '[+3 Pontos] Meta do Pomo de Ouro', value: 3 },
    { name: '[+5 Pontos] Posse do Pomo', value: 5 }
];

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Update rule 3
    db.run("UPDATE scoring_rules SET name = '[+1 Ponto] Story (@marchareab)' WHERE id = 3", function(err) {
        if (err) console.error("Erro no UPDATE ID 3:", err.message);
        else console.log("Regra 3 atualizada.");
    });

    // Inserts
    const stmt = db.prepare("INSERT INTO scoring_rules (name, value) VALUES (?, ?)");
    inserts.forEach(r => {
        stmt.run(r.name, r.value, function(err) {
            if (err) console.error(`Erro ao inserir ${r.name}:`, err.message);
            else console.log(`Nova regra inserida: ${r.name}`);
        });
    });
    stmt.finalize();

    db.run("COMMIT", (err) => {
        if (err) {
            console.error("Erro ao aplicar transação:", err.message);
        } else {
            console.log("Transação de regras de pontuação concluída com sucesso.");
        }
        db.close();
    });
});
