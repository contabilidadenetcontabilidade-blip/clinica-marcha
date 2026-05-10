const db = require('../backend/db');
db.get("SELECT * FROM scoring_rules WHERE name LIKE '%Presença%' OR id = 1", [], (err, row) => {
    console.log(JSON.stringify(row, null, 2));
    process.exit();
});
