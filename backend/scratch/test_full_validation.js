async function main() {
  // Test 1: Athlete scores (the fix)
  console.log('=== TEST 1: ATHLETE 38 SCORES ===');
  const scores = await fetch('http://localhost:3000/api/athletes/38/scores').then(r=>r.json());
  console.log('Count:', scores.length, scores.length > 0 ? 'OK' : 'FAIL');

  // Test 2: Ranking
  console.log('\n=== TEST 2: RANKING ===');
  const rank = await fetch('http://localhost:3000/api/ranking').then(r=>r.json());
  rank.forEach(h => console.log(' ', h.name + ':', h.total_points, 'pts'));
  console.log(rank.length === 5 ? 'OK' : 'FAIL');

  // Test 3: Dashboard casa 1
  console.log('\n=== TEST 3: DASHBOARD CASA 1 ===');
  const dash = await fetch('http://localhost:3000/api/houses/1/dashboard').then(r=>r.json());
  console.log('House:', dash.house.name, '| Points:', dash.totalPoints, '| Athletes:', dash.athletes.length);
  console.log(dash.totalPoints > 0 ? 'OK' : 'FAIL');

  // Test 4: Chat
  console.log('\n=== TEST 4: CHAT ===');
  const chat = await fetch('http://localhost:3000/api/chat/house/1').then(r=>r.json());
  console.log('Messages:', Array.isArray(chat) ? chat.length : 'ERROR', Array.isArray(chat) ? 'OK' : 'FAIL');

  // Test 5: Cards grant
  console.log('\n=== TEST 5: CARDS GRANT ===');
  const card = await fetch('http://localhost:3000/api/cards/grant', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({patient_id: 38, card_name: 'Vida'})
  }).then(r=>r.json());
  console.log('Grant result:', card.success ? 'OK' : 'FAIL', card.message || card.error);

  // Test 6: Pages load
  console.log('\n=== TEST 6: PAGES LOAD ===');
  const cup = await fetch('http://localhost:3000/cup.html');
  console.log('cup.html:', cup.status === 200 ? 'OK' : 'FAIL');
  const casa = await fetch('http://localhost:3000/casa_detalhe.html?id=1');
  console.log('casa_detalhe.html:', casa.status === 200 ? 'OK' : 'FAIL');
  const atleta = await fetch('http://localhost:3000/atleta_detalhe.html?id=38');
  console.log('atleta_detalhe.html:', atleta.status === 200 ? 'OK' : 'FAIL');
}
main().catch(console.error);
