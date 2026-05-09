const http = require('http');

const makeRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // If not JSON
                    }
                } else {
                    reject({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(body);
        }
        req.end();
    });
};

async function testRoutine() {
    console.log("🚀 Iniciando Simulação de Frontend...");

    try {
        // 1. LOGIN
        console.log("\n🔑 [1/3] Login (Tamara)...");
        const loginPayload = JSON.stringify({ username: 'tamara', password: 'marcha2026' });
        const user = await makeRequest('/api/login', 'POST', loginPayload);
        console.log("   ✅ Login OK! Usuário:", user.name, "(Role:", user.role, ")");

        // 2. PACIENTES
        console.log("\n👥 [2/3] Carregando Pacientes...");
        const patients = await makeRequest('/api/patients?active=1');
        console.log(`   ✅ API Pacientes retornou ${patients.length} registros.`);
        if (patients.length > 0) console.log("      Exemplo:", patients[0].name);

        // 3. AGENDA (Appointments)
        console.log("\n📅 [3/3] Carregando Agenda (Sem filtros de data para teste)...");
        const appointments = await makeRequest('/api/appointments');
        console.log(`   ✅ API Agenda retornou ${appointments.length} agendamentos.`);

        console.log("\n✨ TODOS OS TESTES PASSARAM! O Backend está pronto.");

    } catch (error) {
        console.error("\n❌ ERRO DETECTADO:", error);
        if (error.data) console.error("   Detalhe do Erro:", error.data);
    }
}

testRoutine();
