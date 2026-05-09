const http = require('http');

async function testApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("--- TESTANDO API DE CHAT ---");

  // 1. GET (Vazio)
  const get1 = await testApi('GET', '/api/chat/house/1');
  console.log("GET /api/chat/house/1:", get1.status === 200 ? "✅" : "❌", get1.body);

  // 2. CENSURA (Telefone)
  const postCensure = await testApi('POST', '/api/chat/house', {
    house_id: 1, sender_id: 999, sender_name: "Test", message: "meu zap 11 99999-8888"
  });
  console.log("POST (Censura Zap):", postCensure.status === 403 ? "✅" : "❌", postCensure.body.error);

  // 3. POST VÁLIDO
  const postValid = await testApi('POST', '/api/chat/house', {
    house_id: 1, sender_id: 123, sender_name: "Glaubert", message: "Bora ganhar Marcha Cup!"
  });
  console.log("POST (Válido):", postValid.status === 200 ? "✅" : "❌", postValid.body);
  const msgId = postValid.body.id;

  // 4. DELETE SEM PERMISSÃO (Simulado)
  const delFail = await testApi('DELETE', `/api/chat/messages/${msgId}`, {
     requester_id: 999, is_admin: false
  });
  console.log("DELETE (Sem Permissão):", delFail.status === 403 ? "✅" : "❌", delFail.body.error);

  console.log("--- FINALIZADO ---");
  process.exit(0);
}

runTests();
