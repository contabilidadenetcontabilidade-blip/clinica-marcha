const db = require('../backend/db');
db.all(`
    SELECT a.house_id, COUNT(*) as pomo_count
    FROM scores sc
    JOIN athletes a ON sc.athlete_id = a.patient_id
    JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE sr.name LIKE '%Pomo%'
    GROUP BY a.house_id
`, [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
