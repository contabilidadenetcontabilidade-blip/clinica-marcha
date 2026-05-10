const db = require('../backend/db');
const query = `
    SELECT 
      a.house_id,
      strftime('%m', sc.created_at) as month,
      strftime('%Y', sc.created_at) as year,
      SUM(COALESCE(sc.points, sr.value)) as total_meinhas
    FROM scores sc
    JOIN athletes a ON sc.athlete_id = a.patient_id
    LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
    GROUP BY a.house_id, year, month
`;
db.all(query, [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
