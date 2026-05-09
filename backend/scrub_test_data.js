const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const targetNames = [
    'Teste Duplo Nascimento 1773065125899',
    'Teste Duplo Nascimento 1773066062820',
    'Teste Duplo Nascimento 1773066743942'
];

db.serialize(() => {
    db.all(`SELECT id, name FROM patients WHERE name IN (?, ?, ?)`, targetNames, (err, patients) => {
        if (err) {
            console.error("Erro ao buscar pacientes:", err);
            return;
        }

        if (!patients || patients.length === 0) {
            console.log("Nenhum paciente de teste encontrado. A base já pode estar limpa.");
            return;
        }

        const patientIds = patients.map(p => p.id);
        const placeholders = patientIds.map(() => '?').join(',');

        console.log(`Pacientes Encontrados: ${patients.length}`);
        console.log(`IDs Alvo: ${patientIds.join(', ')}`);

        // Consultar Athletes relacionados para deletar logs baseados no athlete_id também
        db.all(`SELECT id FROM athletes WHERE patient_id IN (${placeholders})`, patientIds, (err, athletes) => {
            const athleteIds = athletes ? athletes.map(a => a.id) : [];
            const athPlaceholders = athleteIds.map(() => '?').join(',');

            console.log(`Atletas Relacionados Encontrados: ${athleteIds.length}`);

            db.run("BEGIN TRANSACTION", (err) => {
                if (err) return console.error(err);

                let stats = {
                    points_log: 0,
                    presences: 0,
                    active_effects: 0,
                    scores: 0,
                    student_cards: 0,
                    athletes: 0,
                    patients: 0,
                    appointments: 0,
                    financial: 0
                };

                const executeDelete = (table, column, ids, statKey, callback) => {
                    if (ids.length === 0) return callback();
                    const pl = ids.map(() => '?').join(',');
                    const sql = `DELETE FROM ${table} WHERE ${column} IN (${pl})`;
                    db.run(sql, ids, function (err) {
                        if (err) console.error(`Erro deletando de ${table}:`, err.message);
                        else stats[statKey] += this.changes;
                        callback();
                    });
                };

                // Cascata de exclusão manual para contornar foreign keys ou dependências
                executeDelete('house_points_log', 'student_id', patientIds, 'points_log', () => {
                    executeDelete('presences', 'student_id', patientIds, 'presences', () => {
                        executeDelete('student_cards', 'student_id', patientIds, 'student_cards', () => {
                            executeDelete('appointments', 'patient_id', patientIds, 'appointments', () => {
                                executeDelete('financial_transactions', 'patient_id', patientIds, 'financial', () => {

                                    // Efeitos Ativos (depende de patient_id ou athlete_id?)
                                    // Segundo correções anteriores: beneficiary_id e source_captain_id (ligado a athlete)
                                    // Vamos deletar caso beneficiary_id ou source_captain_id estejam entre os alvos
                                    let activeEffectsSql = `DELETE FROM active_effects WHERE beneficiary_id IN (${placeholders})`;
                                    if (athleteIds.length > 0) {
                                        let athPl = athleteIds.map(() => '?').join(',');
                                        activeEffectsSql += ` OR source_captain_id IN (${athPl})`;
                                    }
                                    let effectParams = [...patientIds];
                                    if (athleteIds.length > 0) effectParams.push(...athleteIds);

                                    db.run(activeEffectsSql, effectParams, function (err) {
                                        if (!err) stats['active_effects'] += this.changes;

                                        // Scores (depende do athlete_id)
                                        executeDelete('scores', 'athlete_id', athleteIds, 'scores', () => {
                                            executeDelete('athletes', 'id', athleteIds, 'athletes', () => {
                                                executeDelete('patients', 'id', patientIds, 'patients', () => {

                                                    db.run("COMMIT", (err) => {
                                                        if (err) {
                                                            console.error("Erro no Commit:", err);
                                                        } else {
                                                            console.log(`Limpeza concluída com sucesso via SQLite.`);
                                                            console.log(`Pacientes (Perfil Base) removidos: ${stats.patients}`);
                                                            console.log(`Atletas (Vínculo Casa) removidos: ${stats.athletes}`);
                                                            console.log(`Registros de Pontos (house_points_log) removidos: ${stats.points_log}`);
                                                            console.log(`Scores Brutos removidos: ${stats.scores}`);
                                                            console.log(`Presenças removidas: ${stats.presences}`);
                                                            console.log(`Efeitos Ativos Coringa/Variáveis removidos: ${stats.active_effects}`);
                                                            console.log(`Cartas do Aluno deletadas: ${stats.student_cards}`);
                                                            console.log(`Consultas Agendadas removidas: ${stats.appointments}`);
                                                            console.log(`Transações Financeiras removidas: ${stats.financial}`);

                                                            const totalLogs = stats.points_log + stats.scores + stats.presences + stats.active_effects + stats.student_cards + stats.appointments + stats.financial;
                                                            console.log(`\nRESUMO CEO: Limpeza concluída. ${stats.patients} registros de pacientes e ${totalLogs} logs associados de teste foram removidos definitivamente.`);
                                                        }
                                                    });

                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
