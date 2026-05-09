const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("==========================================");
console.log("   BATERIA DE TESTES FUNCIONAIS (POMO)    ");
console.log("==========================================");

// Função auxiliar para fazer requisições HTTP locais
function apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', error => reject(error));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// SETUP DE DADOS PARA OS TESTES
async function setupTestEnvironment() {
    return new Promise((resolve) => {
        db.serialize(() => {
            console.log("[START] Preparando dados de teste...");
            // Criar casas
            db.run("INSERT INTO houses (name, color, meta_mensal) VALUES ('Casa Teste 1', '#000', 100)");
            db.run("INSERT INTO houses (name, color, meta_mensal) VALUES ('Casa Teste 2', '#111', 100)");

            // Buscar IDs dinâmicos: O ASC garante que Casa Teste 1 vem primeiro
            db.all("SELECT id, name FROM houses ORDER BY id DESC LIMIT 2", [], (err, houses) => {
                // ASC por nome garante que Casa Teste 1 seja h1 e Casa Teste 2 seja h2
                houses.sort((a, b) => a.name.localeCompare(b.name));
                const h1 = houses[0].id;
                const h2 = houses[1].id;

                db.run("UPDATE houses SET meta_mensal = 100 WHERE id IN (?, ?)", [h1, h2]);

                // Setar log de pontos pra 1º e último lugar pro Golpe de Estado
                db.run("INSERT INTO house_points_log (house_id, points_awarded) VALUES (?, 50)", [h1]);
                db.run("INSERT INTO house_points_log (house_id, points_awarded) VALUES (?, 10)", [h2]);

                // Criar pacientes (alunos)
                db.run("INSERT INTO patients (name) VALUES ('Atacante Teste')", function () {
                    const p1 = this.lastID;
                    db.run("INSERT INTO athletes (name, house_id, patient_id) VALUES ('Atacante Teste', ?, ?)", [h1, p1], function () {
                        const a1 = this.lastID;

                        db.run("INSERT INTO patients (name) VALUES ('Alvo Teste')", function () {
                            const p2 = this.lastID;
                            db.run("INSERT INTO athletes (name, house_id, patient_id) VALUES ('Alvo Teste', ?, ?)", [h2, p2], function () {
                                const a2 = this.lastID;

                                // Limpar recordes do pomo
                                db.run("DELETE FROM pomo_records", () => {
                                    db.run("INSERT INTO pomo_records (category_name, last_pomo_holder) VALUES ('Teste Pomo', ?)", [p1], () => {
                                        resolve({ h1, h2, p1, p2, a1, a2 });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

async function cleanup(env) {
    return new Promise(resolve => {
        db.serialize(() => {
            console.log("[CLEANUP] Removendo dados de teste...");
            db.run("DELETE FROM athletes WHERE patient_id IN (?, ?)", [env.p1, env.p2]);
            db.run("DELETE FROM patients WHERE id IN (?, ?)", [env.p1, env.p2]);
            db.run("DELETE FROM houses WHERE id IN (?, ?)", [env.h1, env.h2]);
            db.run("DELETE FROM pomo_records WHERE category_name = 'Teste Pomo'");
            db.run("DELETE FROM house_points_log WHERE house_id IN (?, ?)", [env.h1, env.h2]);
            db.run("DELETE FROM card_queue WHERE attacker_id = ?", [env.p1]);
            db.run("DELETE FROM student_cards WHERE student_id IN (?, ?)", [env.p1, env.p2]);
            setTimeout(() => { resolve(); }, 500);
        });
    });
}

function queryDb(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function runTests() {
    let env;
    try {
        env = await setupTestEnvironment();
        let passed = 0;
        let total = 0;

        console.log(`\n=> Test IDs: Atacante (${env.p1}, Casa ${env.h1}) | Alvo (${env.p2}, Casa ${env.h2})`);

        const getCardId = async (name) => {
            const rows = await queryDb("SELECT id FROM cards WHERE name = ? LIMIT 1", [name]);
            return rows.length > 0 ? rows[0].id : null;
        };

        const ladinoId = await getCardId('Ladino');
        const trapacaId = await getCardId('Trapaça');
        const golpeId = await getCardId('Golpe de Estado');
        const zicaId = await getCardId('Zica');

        // ==========================================
        // TESTE 1: LADINO E REAÇÃO (DEFESA)
        // ==========================================
        console.log("\n[TESTE 1] Ladino e Reverso...");
        total++;

        // Dar Ladino para o Atacante
        await new Promise(res => db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, 'FAKELADINOHASH123', 0)", [env.p1, ladinoId], res));

        // 1.1 Simular uso do Ladino via API
        const ladinoCardRow = await queryDb("SELECT id FROM student_cards WHERE student_id = ? AND card_id = ?", [env.p1, ladinoId]);
        const ladinoRes = await apiRequest('POST', '/api/student-cards/use', {
            student_card_id: ladinoCardRow[0].id,
            description: 'Casa Teste 2',
            hash: 'FAKELADINOHASH123'
        });

        const queueRows = await queryDb("SELECT * FROM card_queue WHERE attacker_id = ? AND card_name = 'Ladino' ORDER BY id DESC LIMIT 1", [env.p1]);
        if (queueRows.length === 1 && queueRows[0].status === 'PENDENTE') {
            console.log(" ✅ [1.1] Ataque Ladino inserido com status PENDENTE.");

            // 1.2 Dar carta Reverso para o alvo
            await new Promise(res => db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, (SELECT id FROM cards WHERE name='Reverso' LIMIT 1), 'FAKEREVERSO123', 0)", [env.p2], res));

            // 1.3 Alvo (p2) reage com Reverso
            const reactRes = await apiRequest('POST', '/api/cards/react', {
                student_id: env.p2,
                action: 'REVERSO',
                card_queue_id: queueRows[0].id,
                defense_card_hash: 'FAKEREVERSO123'
            });

            if (reactRes.status === 200 && reactRes.data.success) {
                const checkQueue = await queryDb("SELECT status FROM card_queue WHERE id = ?", [queueRows[0].id]);
                if (checkQueue[0].status === 'REVERTIDO') {
                    console.log(" ✅ [1.2] Reverso aplicado com sucesso! Ataque revertido.");
                    passed++;
                } else {
                    console.log(" ❌ [1.2] Reverso falhou, status na fila:", checkQueue[0].status);
                }
            } else {
                console.log(" ❌ [1.2] Erro na API de reação:", reactRes.data);
            }
        } else {
            console.log(" ❌ [1.1] Falha ao registrar Ladino pendente.", queueRows);
        }

        // ==========================================
        // TESTE 2: REGRAS DE OURO (TRAPAÇA)
        // ==========================================
        console.log("\n[TESTE 2] Trapaça (+15% Meta Mensal)...");
        total++;

        const oldTargetHouse = await queryDb("SELECT meta_mensal FROM houses WHERE id = ?", [env.h2]);
        const oldMeta = oldTargetHouse[0].meta_mensal || 0;

        await new Promise(res => db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, 'FAKETRAPACA123', 0)", [env.p1, trapacaId], res));

        const trapacaCardRow = await queryDb("SELECT id FROM student_cards WHERE student_id = ? AND card_id = ?", [env.p1, trapacaId]);
        const trapacaRes = await apiRequest('POST', '/api/student-cards/use', {
            student_card_id: trapacaCardRow[0].id,
            description: 'Casa Teste 2',
            hash: 'FAKETRAPACA123'
        });

        if (trapacaRes.status === 200) {
            await new Promise(res => setTimeout(res, 1000)); // Delay to ensure DB COMMIT is flushed
            const newTargetHouse = await queryDb("SELECT meta_mensal FROM houses WHERE id = ?", [env.h2]);
            const newMeta = newTargetHouse[0].meta_mensal;

            // Math.floor ou round? O SQLite pode truncar int se a coluna não for decimal. Vamos ver.
            const expectedMeta = Math.floor(oldMeta * 1.15);

            if (newMeta === expectedMeta || newMeta === Math.ceil(oldMeta * 1.15)) {
                console.log(` ✅ [2.1] Trapaça aplicada! Meta subiu de ${oldMeta} para ${newMeta} (15%)`);
                passed++;
            } else {
                console.log(` ❌ [2.1] Erro na matemática da Trapaça. Antigo: ${oldMeta}, Atual: ${newMeta}, Esperado: ~${expectedMeta}`);
            }
        } else {
            console.log(" ❌ [2.1] API Trapaça falhou:", trapacaRes.data);
        }

        // ==========================================
        // TESTE 3: REGRAS DE OURO (GOLPE DE ESTADO)
        // ==========================================
        console.log("\n[TESTE 3] Golpe de Estado (Transferência)...");
        total++;
        // No setup, H1 tem 50 pontos, H2 tem 10 pontos. O alvo do Golpe é a casa "em 1º", que é descoberta dinamicamente na rota.
        // Simulamos como se o p2 (da casa perdedora H2) usasse a carta para roubar tudo da casa vencedora (H1).

        await new Promise(res => db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, 'FAKEGOLPE123', 0)", [env.p2, golpeId], res));

        const golpeCardRow = await queryDb("SELECT id FROM student_cards WHERE student_id = ? AND card_id = ?", [env.p2, golpeId]);
        const golpeRes = await apiRequest('POST', '/api/student-cards/use', {
            student_card_id: golpeCardRow[0].id,
            hash: 'FAKEGOLPE123'
        });

        if (golpeRes.status === 200) {
            // Verificar os logs injetados
            const checkLogs = await queryDb("SELECT * FROM house_points_log WHERE description LIKE '%Golpe de Estado%' ORDER BY id DESC LIMIT 2");
            if (checkLogs.length === 2 && checkLogs.some(l => l.points_awarded < 0) && checkLogs.some(l => l.points_awarded > 0)) {
                console.log(" ✅ [3.1] Golpe de Estado transferiu o saldo com sucesso!");
                console.log("   -> Logs:", checkLogs.map(l => `Casa ${l.house_id}: ${l.points_awarded}`).join(' | '));
                passed++;
            } else {
                console.log(" ❌ [3.1] Logs do Golpe de Estado incorretos ou não encontrados:", checkLogs);
            }
        } else {
            console.log(" ❌ [3.1] API Golpe falhou:", golpeRes.data);
        }


        // ==========================================
        // TESTE 4: POMO E ATAQUE PENDENTE (GATILHO FRONTEND)
        // ==========================================
        console.log("\n[TESTE 4] Monitoramento do Frontend (Pomo Status)...");
        total++;

        // Atribuimos Pomo ao P1 no setup e disparamos um 'Zica' contra o P1 (vindo do P2) para testar o alerta de ataque pendente
        await new Promise(res => db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, 'FAKEZICA123', 0)", [env.p2, zicaId], res));

        const zicaCardRow = await queryDb("SELECT id FROM student_cards WHERE student_id = ? AND card_id = ?", [env.p2, zicaId]);
        const zicaRes = await apiRequest('POST', '/api/student-cards/use', {
            student_card_id: zicaCardRow[0].id,
            description: 'Casa Teste 1',
            hash: 'FAKEZICA123'
        });

        console.log(" -> Zica API Response:", zicaRes.data);
        await new Promise(res => setTimeout(res, 1000)); // Wait for COMMIT

        const pomoStatusRes = await apiRequest('GET', `/api/student/${env.p1}/pomo-status`);
        if (pomoStatusRes.status === 200) {
            const statusData = pomoStatusRes.data;
            if (statusData.isHolder === true && statusData.hasPendingAttack === true) {
                console.log(" ✅ [4.1] Endpoint de Status leu que o Aluno Tem Pomo e Possui Ataque Pendente.");
                passed++;
            } else {
                console.log(" ❌ [4.1] Endpoint de Status retornou informações incorretas:", statusData);
            }
        } else {
            console.log(" ❌ [4.1] Endpoint de Status falhou:", pomoStatusRes.raw);
        }


        console.log("\n==========================================");
        console.log(` RESULTADO FINAL: ${passed}/${total} testes passaram.`);
        if (passed === total) console.log(" TUDO VERDE! Sistemas totalmente operacionais.");
        else console.log(" ATENÇÃO: Verifique as falhas acima.");
        console.log("==========================================\n");

    } catch (err) {
        console.error("ERRO FATAL NO TESTE:", err);
    } finally {
        if (env) await cleanup(env);
        db.close();
    }
}

runTests();
