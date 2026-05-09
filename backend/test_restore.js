const http = require('http');

function checkUrl(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data: data });
            });
        }).on('error', (err) => {
            resolve({ status: 'ERROR', error: err.message });
        });
    });
}

async function verify() {
    console.log('--- Verificação de Emergência ---');

    // 1. Check Login Page
    const login = await checkUrl('/login.html');
    console.log(`[LOGIN PAGE] Status: ${login.status}`);
    if (login.status === 200) {
        console.log('✅ Login page acessível.');
    } else {
        console.error('❌ Login page FALHOU.');
    }

    // 2. Check API
    const patients = await checkUrl('/api/patients');
    console.log(`[API PATIENTS] Status: ${patients.status}`);
    if (patients.status === 200) {
        try {
            const list = JSON.parse(patients.data);
            console.log(`✅ API retornou ${list.length} pacientes.`);
        } catch (e) { console.error('❌ Erro parse JSON API'); }
    } else {
        console.error('❌ API Falhou.');
    }
}

verify();

