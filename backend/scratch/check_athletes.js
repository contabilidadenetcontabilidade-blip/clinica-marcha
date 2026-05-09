const db = require('../db');
db.all('SELECT * FROM athletes LIMIT 5', [], (e, r) => {
    console.log('ATHLETES:', r);
    process.exit();
});
