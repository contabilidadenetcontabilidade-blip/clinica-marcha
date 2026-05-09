const db = require('../db');
db.all('SELECT * FROM scores LIMIT 10', [], (e, r) => {
    console.log('SCORES_DATA:', r);
    process.exit();
});
