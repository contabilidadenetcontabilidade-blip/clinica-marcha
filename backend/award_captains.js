const db = require('./db');

console.log("=== Iniciando Premiação de Capitães (+5 pontos) ===");

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Buscamos a regra "Capitão Mensal" ou usamos a de ID=1 como fallback/criamos uma adhoc
    db.get("SELECT id FROM scoring_rules WHERE name LIKE '%Capitã%'", [], (err, rule) => {
        let ruleId = 99; // Usaremos 99 (Adhoc) se não houver regra específica de Capitão
        if (rule) ruleId = rule.id;

        const pointsToAward = 5;
        const description = "Bônus Mensal de Capitão (+5 Pontos)";

        db.all("SELECT a.id as athlete_id, a.name, a.house_id, a.patient_id FROM athletes a WHERE a.is_captain = 1", [], (err, captains) => {
            if (err) {
                console.error("Erro ao buscar capitães:", err.message);
                db.run("ROLLBACK");
                process.exit(1);
            }

            if (!captains || captains.length === 0) {
                console.log("Nenhum capitão encontrado.");
                db.run("COMMIT");
                process.exit(0);
            }

            let completed = 0;
            let errors = 0;

            captains.forEach(cap => {
                db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)", [cap.patient_id, ruleId], function (err) {
                    if (err) {
                        console.error(`Erro inserindo score para ${cap.name}:`, err.message);
                        errors++;
                    } else {
                        db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [cap.house_id, cap.patient_id, pointsToAward, description], (err) => {
                            if (err) {
                                console.error(`Erro inserindo log para ${cap.name}:`, err.message);
                                errors++;
                            } else {
                                console.log(`[OK] Bônus creditado para o Capitão: ${cap.name}`);
                            }

                            completed++;
                            if (completed === captains.length) {
                                if (errors > 0) {
                                    console.log("Finalizado com erros. Revertendo transação.");
                                    db.run("ROLLBACK");
                                    process.exit(1);
                                } else {
                                    db.run("COMMIT");
                                    console.log(`\nSucesso! ${completed} capitães receberam os 5 pontos.`);
                                    process.exit(0);
                                }
                            }
                        });
                    }
                });
            });
        });
    });
});
