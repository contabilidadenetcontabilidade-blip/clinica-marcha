const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../database.sqlite');

async function run() {
  // ANTES
  console.log('=== ANTES DO UPDATE ===');
  const before = await query(`
    SELECT sr.id, sr.name, COUNT(*) as total, SUM(sc.points) as pontos_totais
    FROM scores sc
    JOIN scoring_rules sr ON sc.rule_id = sr.id
    GROUP BY sr.id
    ORDER BY pontos_totais DESC
  `);
  before.forEach(r => console.log(`  ${r.name}: ${r.total} registros, ${r.pontos_totais} pts`));

  // UPDATE: mover rule_id 99 → 1 (Presença)
  console.log('\n=== EXECUTANDO UPDATE ===');
  const result = await runSql('UPDATE scores SET rule_id = 1 WHERE rule_id = 99');
  console.log(`  Linhas atualizadas: ${result.changes}`);

  // DEPOIS
  console.log('\n=== DEPOIS DO UPDATE ===');
  const after = await query(`
    SELECT sr.id, sr.name, COUNT(*) as total, SUM(sc.points) as pontos_totais
    FROM scores sc
    JOIN scoring_rules sr ON sc.rule_id = sr.id
    GROUP BY sr.id
    ORDER BY pontos_totais DESC
  `);
  after.forEach(r => console.log(`  ${r.name}: ${r.total} registros, ${r.pontos_totais} pts`));

  // Verificar ranking intacto
  console.log('\n=== RANKING CHECK ===');
  const ranking = await query(`
    SELECT h.name,
           COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) as total_points
    FROM houses h
    LEFT JOIN athletes a ON h.id = a.house_id
    LEFT JOIN scores sc ON a.patient_id = sc.athlete_id
    LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE h.active = 1
    GROUP BY h.id
    ORDER BY total_points DESC
  `);
  ranking.forEach(r => console.log(`  ${r.name}: ${r.total_points} pts`));
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

run().then(() => db.close()).catch(e => { console.error(e); db.close(); });
