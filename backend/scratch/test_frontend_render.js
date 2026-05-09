const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  // Test 1: HTML page loads
  console.log('=== TEST 1: HTML LOADS ===');
  const page = await get('http://localhost:3000/casa_detalhe.html?id=1');
  console.log('Status:', page.status);
  console.log('Has total-points span:', page.body.includes('id="total-points"'));
  console.log('Has house-name span:', page.body.includes('id="house-name"'));
  console.log('Has casa_detalhe.js:', page.body.includes('casa_detalhe.js'));
  console.log('Has utils.js:', page.body.includes('utils.js'));
  console.log('Has modal-score:', page.body.includes('modal-score'));
  console.log('Has section-chat:', page.body.includes('section-chat'));

  // Test 2: Dashboard API
  console.log('\n=== TEST 2: DASHBOARD API ===');
  const dash = await get('http://localhost:3000/api/houses/1/dashboard');
  const j = JSON.parse(dash.body);
  console.log('House name:', j.house.name);
  console.log('Total points:', j.totalPoints);
  console.log('Athletes count:', j.athletes.length);
  console.log('Top 3:', j.athletes.slice(0,3).map(a => a.name + ' (' + a.total_points + ')'));

  // Test 3: JS files accessible
  console.log('\n=== TEST 3: JS FILES ===');
  const utils = await get('http://localhost:3000/utils.js');
  console.log('utils.js status:', utils.status);
  const casaJs = await get('http://localhost:3000/casa_detalhe.js');
  console.log('casa_detalhe.js status:', casaJs.status);

  // Test 4: Ranking API
  console.log('\n=== TEST 4: RANKING API ===');
  const rank = await get('http://localhost:3000/api/ranking');
  const houses = JSON.parse(rank.body);
  houses.forEach(h => console.log(`  ${h.name}: ${h.total_points} pts`));

  // Test 5: Cup page
  console.log('\n=== TEST 5: CUP PAGE ===');
  const cup = await get('http://localhost:3000/cup.html');
  console.log('cup.html status:', cup.status);
  console.log('Has houses-list:', cup.body.includes('houses-list'));
  console.log('Has cup.js:', cup.body.includes('cup.js'));
}

main().catch(console.error);
