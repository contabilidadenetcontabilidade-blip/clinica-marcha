// Script de teste da API
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const tests = [];
let passed = 0;
let failed = 0;

function test(name, url, method = 'GET', body = null, expectedStatus = 200) {
  return new Promise((resolve) => {
    const urlObj = new URL(url, BASE_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        if (success) {
          passed++;
          console.log(`✓ ${name}`);
        } else {
          failed++;
          console.log(`✗ ${name} - Esperado ${expectedStatus}, recebido ${res.statusCode}`);
          if (data) console.log(`  Resposta: ${data.substring(0, 100)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      failed++;
      console.log(`✗ ${name} - Erro: ${err.message}`);
      resolve();
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando testes da API...\n');
  
  // Aguarda servidor iniciar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Testes básicos
  await test('GET /api/houses - Listar casas', '/api/houses');
  await test('GET /api/rules - Listar regras', '/api/rules');
  
  // Teste de criação de regra
  await test(
    'POST /api/rules - Criar regra',
    '/api/rules',
    'POST',
    { name: 'Teste Regra', value: 10 },
    200
  );

  // Teste de criação de regra com valor negativo
  await test(
    'POST /api/rules - Criar regra negativa',
    '/api/rules',
    'POST',
    { name: 'Teste Penalidade', value: -5 },
    200
  );

  // Teste de validação (sem nome)
  await test(
    'POST /api/rules - Validação de dados obrigatórios',
    '/api/rules',
    'POST',
    { value: 10 },
    400
  );

  // Teste de endpoint inexistente
  await test(
    'GET /api/inexistente - Endpoint não encontrado',
    '/api/inexistente',
    'GET',
    null,
    404
  );

  // Listar regras novamente para verificar criação
  await test('GET /api/rules - Listar regras (verificar criação)', '/api/rules');

  console.log(`\n📊 Resultado: ${passed} passou, ${failed} falhou`);
  
  if (failed === 0) {
    console.log('✅ Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('❌ Alguns testes falharam');
    process.exit(1);
  }
}

runTests();

