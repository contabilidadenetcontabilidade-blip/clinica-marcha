const db = require('../backend/db');
db.all('SELECT sc.*, sr.name as rule_name FROM scores sc JOIN scoring_rules sr ON sc.rule_id = sr.id WHERE athlete_id = 168', [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
