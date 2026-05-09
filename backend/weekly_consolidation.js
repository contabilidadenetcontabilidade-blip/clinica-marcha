const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'marcha.db');
const db = new sqlite3.Database(dbPath);

console.log("==========================================");
console.log("🏆 CONSOLIDAÇÃO SEMANAL - MARCHA CUP 2026");
console.log("==========================================\n");

function generateHash() {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
}

function runWeeklyConsolidation() {
    const currentDate = new Date();

    // Define o início e fim da semana (Segunda a Domingo)
    const dayOfWeek = currentDate.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;

    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - distanceToMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    console.log(`Período de Análise: ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}\n`);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. MAIOR PONTUADOR DA SEMANA (Ganha 1 Carta Épica)
        const topScorerQuery = `
      SELECT a.id as athlete_id, p.id as patient_id, a.name, SUM(sr.value) as total_points
      FROM scores s
      JOIN athletes a ON s.athlete_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN scoring_rules sr ON s.rule_id = sr.id
      WHERE s.created_at BETWEEN ? AND ?
      GROUP BY a.id
      ORDER BY total_points DESC
      LIMIT 1
    `;

        db.get(topScorerQuery, [startIso, endIso], (err, topScorer) => {
            if (err) { console.error("Erro ao buscar Maior Pontuador:", err.message); }
            if (topScorer && topScorer.total_points > 0) {
                console.log(`🥇 Maior Pontuador: ${topScorer.name} com ${topScorer.total_points} pontos!`);

                db.get("SELECT id, name FROM cards WHERE rarity = 'Épica' ORDER BY RANDOM() LIMIT 1", [], (err, card) => {
                    if (card) {
                        db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [topScorer.patient_id, card.id, generateHash()], () => {
                            console.log(`   -> Recebeu Carta Épica: ${card.name}`);
                        });
                    }
                });
            } else {
                console.log(`💨 Nenhum ponto registrado nesta semana para definir Maior Pontuador.`);
            }

            // 2. 100% DE PRESENÇA NA SEMANA (Sem faltas, e no mínimo 1 presença -> 1 Carta Épica)
            const flawlessQuery = `
        SELECT a.id as athlete_id, p.id as patient_id, a.name
        FROM athletes a
        JOIN patients p ON a.patient_id = p.id
        WHERE EXISTS (
            SELECT 1 FROM scores s1 JOIN scoring_rules sr1 ON s1.rule_id = sr1.id 
            WHERE s1.athlete_id = a.id AND sr1.name = 'Presença' AND s1.created_at BETWEEN ? AND ?
        )
        AND NOT EXISTS (
            SELECT 1 FROM scores s2 JOIN scoring_rules sr2 ON s2.rule_id = sr2.id 
            WHERE s2.athlete_id = a.id AND sr2.name = 'Falta' AND s2.created_at BETWEEN ? AND ?
        )
      `;

            db.all(flawlessQuery, [startIso, endIso, startIso, endIso], (err, flawlessAthletes) => {
                if (err) { console.error("Erro ao buscar atletas com 100% de Presença:", err.message); }

                if (flawlessAthletes && flawlessAthletes.length > 0) {
                    console.log(`\n💯 Atletas com 100% de Presença (Sem Faltas): ${flawlessAthletes.length} encontrados.`);

                    db.all("SELECT id, name FROM cards WHERE rarity = 'Épica'", [], (err, epicCards) => {
                        if (epicCards && epicCards.length > 0) {
                            flawlessAthletes.forEach(athlete => {
                                const randomCard = epicCards[Math.floor(Math.random() * epicCards.length)];
                                db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [athlete.patient_id, randomCard.id, generateHash()], () => {
                                    console.log(`   -> ${athlete.name} recebeu Carta Épica: ${randomCard.name}`);
                                });
                            });
                        }
                    });
                } else {
                    console.log(`\n💯 Nenhum atleta com 100% de Presença esta semana.`);
                }

                // 3. REVELAÇÃO CORINGA (MODO STEALTH)
                const stealthQuery = `
                  SELECT ae.id, ae.source_captain_id, ae.beneficiary_id, ae.house_id as beneficiary_house, ae.stolen_points_accumulator,
                         p1.name as cap_name, a1.house_id as cap_house, p2.name as ben_name
                  FROM active_effects ae
                  JOIN athletes a1 ON ae.source_captain_id = a1.id
                  JOIN patients p1 ON a1.patient_id = p1.id
                  JOIN patients p2 ON ae.beneficiary_id = p2.id
                  WHERE ae.effect_type = 'CORINGA_REDIRECTION' 
                    AND ae.expires_at <= CURRENT_TIMESTAMP 
                    AND ae.stolen_points_accumulator > 0
                `;

                db.all(stealthQuery, [], (err, expiredCoringas) => {
                    if (err) { console.error("Erro na Revelação do Coringa:", err.message); }

                    if (expiredCoringas && expiredCoringas.length > 0) {
                        expiredCoringas.forEach(coringa => {
                            const { id, cap_house, beneficiary_house, stolen_points_accumulator, cap_name, ben_name } = coringa;
                            console.log(`\n🃏 REVELAÇÃO CORINGA: ${ben_name} roubou ${stolen_points_accumulator} pontos de ${cap_name}!`);

                            // Débito do Capitão
                            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                                [cap_house, coringa.source_captain_id, -stolen_points_accumulator, `REVELAÇÃO CORINGA: -${stolen_points_accumulator} pontos. O Coringa plantado por ${ben_name} extraiu seus ganhos da última semana.`]);

                            // Crédito do Beneficiário
                            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                                [beneficiary_house, coringa.beneficiary_id, stolen_points_accumulator, `REVELAÇÃO CORINGA: ${ben_name} coletou ${stolen_points_accumulator} pontos desviados de ${cap_name} durante a última semana!`]);

                            // Remover Efeito
                            db.run("DELETE FROM active_effects WHERE id = ?", [id]);
                        });
                    }

                    // Commit final
                    db.run("COMMIT", (err) => {
                        if (err) { console.error("Erro no Commit:", err.message); }
                        else { console.log("\n✅ ROTINA SEMANAL CONCLUÍDA E SALVA NO BANCO DE DADOS."); }
                        db.close();
                    });
                });
            });
        });
    });
}

runWeeklyConsolidation();
