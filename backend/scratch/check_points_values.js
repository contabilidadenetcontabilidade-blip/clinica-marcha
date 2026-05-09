const db = require('../db');
db.all('SELECT athlete_id, points, sr.value FROM scores sc LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id LIMIT 3', [], (e, r) => {
    if (e) {
        console.error('ERROR:', e.message);
    } else {
        console.log('RESULTS:', JSON.stringify(r, null, 2));
    }
    process.exit();
});
