const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../database.sqlite');

async function run() {
  // PASSO 0: Listar todas as categorias
  console.log('=== PASSO 0: TODAS AS CATEGORIAS ===');
  const rules = await query('SELECT id, name, value FROM scoring_rules ORDER BY id');
  rules.forEach(r => console.log(`  ID ${r.id}: "${r.name}" (${r.value > 0 ? '+' : ''}${r.value})`));

  // Procurar Presença especificamente
  const presenca = rules.find(r => r.name.toLowerCase().includes('presen'));
  console.log('\nPresença encontrada:', presenca || 'NÃO ENCONTRADA');

  // PASSO 1: Quantos pontos em Adhoc/Extra (99)
  console.log('\n=== PASSO 1: CONTAGEM ADHOC (ID 99) ===');
  const adhoc = await query('SELECT COUNT(*) as count, SUM(points) as total FROM scores WHERE rule_id = 99');
  console.log(`  Registros em Adhoc/Extra: ${adhoc[0].count}`);
  console.log(`  Total de pontos: ${adhoc[0].total}`);

  // Verificar se todos são de mesma natureza (pontos=1 que é presença)
  console.log('\n=== DISTRIBUIÇÃO DE VALORES EM ADHOC ===');
  const distrib = await query('SELECT points, COUNT(*) as count FROM scores WHERE rule_id = 99 GROUP BY points ORDER BY count DESC');
  distrib.forEach(d => console.log(`  points=${d.points}: ${d.count} registros`));
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

run().then(() => db.close()).catch(e => { console.error(e); db.close(); });
