const db = require('../backend/db');
db.all("SELECT * FROM scoring_rules WHERE name LIKE '%Pomo%'", [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
