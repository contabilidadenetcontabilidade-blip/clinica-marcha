const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/home/ubuntu/marcha/database.sqlite');
db.all('SELECT sc.*, sr.name as rule_name FROM scores sc JOIN scoring_rules sr ON sc.rule_id = sr.id WHERE athlete_id = 10174', [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
