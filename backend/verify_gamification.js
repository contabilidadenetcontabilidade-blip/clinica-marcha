const sqlite3 = require('sqlite3').verbose();
const http = require('http');

const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

async function test() {
    console.log('--- Buscando IDs do Airton ---');
    const airton = await new Promise((resolve) => {
        db.get("SELECT a.id as athlete_id, a.patient_id FROM athletes a JOIN patients p ON a.patient_id = p.id WHERE p.name = 'AIRTON RODOLFO NASCIMENTO'", (_, r) => resolve(r));
    });

    if (!airton) {
        console.error('Airton não encontrado!');
        db.close();
        return;
    }
    console.log('IDs encontrados:', airton);

    const postData = JSON.stringify({
        athlete_id: airton.athlete_id,
        rule_id: 1 // [+1 Ponto] Presença
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/scores',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    console.log('--- Executando 3 chamadas de presença ---');
    for (let i = 1; i <= 3; i++) {
        await new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    console.log(`Chamada ${i}: Status ${res.statusCode} - ${body}`);
                    resolve();
                });
            });
            req.on('error', (e) => {
                console.error(`Erro na chamada ${i}:`, e.message);
                resolve();
            });
            req.write(postData);
            req.end();
        });
    }

    console.log('--- Verificando cartas ---');
    const cards = await new Promise((resolve) => {
        db.all("SELECT sc.*, c.name as card_name FROM student_cards sc JOIN cards c ON sc.card_id = c.id WHERE sc.student_id = ?", [airton.patient_id], (_, r) => resolve(r));
    });

    console.log('Cartas atuais do Airton:', JSON.stringify(cards, null, 2));
    db.close();
}

test();
