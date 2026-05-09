const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');

let results = [];

async function testCard(card) {
  return new Promise((resolve) => {
    // We send a card_id that exists in 'cards' table using it as 'student_card_id'
    // This will likely return 404 because it's not in 'student_cards', or 400 if hash mismatch.
    // This is fine to validate that the route is UP and VALIDATING.
    const payload = JSON.stringify({
      student_card_id: card.id,
      hash: 'TEST_HASH',
      card_name: card.name,
      target_house_id: 1 // providing a dummy target
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cards/use',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        results.push({
          id: card.id,
          name: card.name,
          status: res.statusCode,
          response: data.substring(0, 100)
        });
        resolve();
      });
    });

    req.on('error', (e) => {
      results.push({
        id: card.id,
        name: card.name,
        status: 'ERROR',
        response: e.message
      });
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

function runTests() {
  db.all('SELECT id, name FROM cards', [], async (err, cards) => {
    if (err) {
      console.error("Erro ao listar cartas no DB:", err);
      process.exit(1);
    }

    for (const card of cards) {
      await testCard(card);
      await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n=== TESTE DE CARTAS ===\n');
    results.forEach(r => {
      // 200 = Success (unlikely here without valid student_card_id)
      // 400/404 = Expected validation responses (Route is alive)
      // 500 = Backend Crash
      const icon = (r.status === 200 || r.status === 400 || r.status === 404) ? '✅' : '❌';
      console.log(`${icon} ${r.id}: ${r.name} (HTTP ${r.status})`);
    });

    const passed = results.filter(r => r.status === 200 || r.status === 400 || r.status === 404).length;
    console.log(`\n✅ PASSOU: ${passed}/${results.length}`);
    console.log(`❌ FALHOU: ${results.length - passed}/${results.length}`);
    
    db.close();
  });
}

runTests();
