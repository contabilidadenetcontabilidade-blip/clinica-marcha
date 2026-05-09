const db = require('../db');
const query1 = `
  SELECT a.id, a.patient_id, COUNT(sc.id) as scores_count
  FROM athletes a
  LEFT JOIN scores sc ON a.patient_id = sc.athlete_id
  WHERE a.patient_id IS NOT NULL
  GROUP BY a.patient_id
  LIMIT 5
`;
db.all(query1, [], (e, r) => {
  console.log('TEST 1 (JOIN):', JSON.stringify(r, null, 2));
  const query2 = `SELECT DISTINCT athlete_id FROM scores LIMIT 5`;
  db.all(query2, [], (e2, r2) => {
    console.log('TEST 2 (DISTINCT athlete_id):', JSON.stringify(r2, null, 2));
    const query3 = `SELECT * FROM scoring_rules WHERE id = 99`;
    db.all(query3, [], (e3, r3) => {
        console.log('TEST 3 (Rule 99):', JSON.stringify(r3, null, 2));
        process.exit();
    });
  });
});
