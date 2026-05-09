const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'marcha.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
});

// Forjando um teste de apontamento validando a logica de points_log
db.serialize(() => {
    console.log("--- TESTANDO GATILHO DE PONTOS DA AGENDA ---");
    // Inserir paciente fake
    db.run("INSERT INTO patients (name) VALUES ('Paciente Teste Automacao')", function (err) {
        if (err) return console.error(err);
        const patientId = this.lastID;

        // Limpar house_id do athlete para esse paciente caso exista sujeira, depois insere
        db.run("INSERT INTO athletes (name, house_id, patient_id) VALUES ('Paciente Teste Automacao', 1, ?)", [patientId], function (err) {

            // Inserir agendamento fake
            db.run("INSERT INTO appointments (patient_id, title, appointment_date, start_time, status) VALUES (?, 'Sessão Teste', '2026-03-08', '10:00', 'agendado')", [patientId], function (err) {
                if (err) return console.error(err);
                const aptId = this.lastID;
                console.log(`[1] Agendamento (ID: ${aptId}) criado com status 'agendado' para paciente ${patientId}`);

                // Simular chamada PUT local
                const http = require('http');
                const data = JSON.stringify({ patient_id: patientId, title: 'Sessão Teste', appointment_date: '2026-03-08', start_time: '10:00', status: 'realizado' });

                const options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/appointments/${aptId}`,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
                };

                console.log("[2] Disparando PUT /api/appointments/" + aptId + " alterando status para 'realizado'...");
                const req = http.request(options, (res) => {
                    res.on('data', () => { });
                    res.on('end', () => {
                        setTimeout(() => {
                            console.log("[3] Verificando house_points_log no BD...");
                            db.all("SELECT * FROM house_points_log WHERE student_id = ? ORDER BY id DESC LIMIT 1", [patientId], (err, rows) => {
                                if (rows && rows.length > 0) {
                                    console.log("SUCESSO: Ponto(s) inserido(s) via gatilho!");
                                    console.log("=>", rows[0]);
                                } else {
                                    console.log("FALHA: O gatilho não inseriu os pontos.");
                                }

                                // Cleanup
                                db.run("DELETE FROM house_points_log WHERE student_id = ?", [patientId]);
                                db.run("DELETE FROM appointments WHERE id = ?", [aptId]);
                                db.run("DELETE FROM athletes WHERE patient_id = ?", [patientId]);
                                db.run("DELETE FROM patients WHERE id = ?", [patientId], () => {
                                    db.close();
                                });
                            });
                        }, 500);
                    });
                });

                req.write(data);
                req.end();
            });
        });
    });
});
