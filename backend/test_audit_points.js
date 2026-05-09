const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./marcha.db');

const athleteId = 1; // Assuming Tamara is ID 1 in athletes table
const ruleId = 12; // Dummy rule ID for 50 pts
const points = 50; // Depending on the rule, but let's assume rule 12 is valid

db.serialize(() => {
    const query = `
        INSERT INTO scores (athlete_id, rule_id)
        VALUES (?, ?)
    `;

    db.run(query, [athleteId, ruleId], function (err) {
        if (err) {
            console.error("Erro ao injetar pontos:", err.message);
            return;
        }
        console.log(`Sucesso! Ponto (Regra ${ruleId}) injetado para o atleta ${athleteId}.`);

        // Atribua pontos a um aluno e verifique se o total no banco marcha-db e no painel do aluno condiz com a regra.
        // We'll calculate total from scores table instead
        db.get('SELECT COALESCE(SUM(sr.value), 0) as total_points FROM scores s JOIN scoring_rules sr ON s.rule_id = sr.id WHERE s.athlete_id = ?', [athleteId], (err, row) => {
            if (err) {
                console.error("Erro ao checar saldo:", err);
                return;
            }
            console.log("Saldo total calculado dinamicamente no banco:", row);
        });
    });
});
