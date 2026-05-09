const http = require('http');

console.log("🔍 CHECK: Testando Login via Script Headless...");

const data = JSON.stringify({
    username: 'tamara',
    password: 'marcha2026'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`📡 STATUS HTTP: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('📦 RESPOSTA: ' + body);

        try {
            const json = JSON.parse(body);
            if (res.statusCode === 200 && json.name) {
                console.log(`✅ SUCESSO TOTAL: Usuário '${json.name}' autenticado!`);
                console.log(`🔑 ID: ${json.id} | Role: ${json.role}`);
            } else {
                console.log("❌ FALHA NO LOGIN: Verifique credenciais ou banco.");
            }
        } catch (e) {
            console.log("❌ ERRO AO LER JSON:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ ERRO DE CONEXÃO: O servidor parece offline ou inacessível. Detalhe: ${e.message}`);
});

req.write(data);
req.end();
