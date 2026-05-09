const db = require('../db');
db.all(`
  SELECT sc.*, p.name, h.name as casa
  FROM scores sc
  JOIN athletes a ON sc.athlete_id = a.id
  JOIN patients p ON a.patient_id = p.id
  JOIN houses h ON a.house_id = h.id
  LIMIT 5
`, [], (e, r) => {
  if (e) {
    console.error('ERROR:', e.message);
  } else {
    console.log('SCORES:', JSON.stringify(r, null, 2));
  }
  process.exit();
});
