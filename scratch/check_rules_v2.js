const db = require('../backend/db');
db.all("SELECT * FROM scoring_rules WHERE value = 100 OR value = 1", [], (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
