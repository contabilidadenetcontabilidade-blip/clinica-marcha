const db = require('../db');
db.get('SELECT COUNT(*) as cnt FROM scores', [], (e, r) => {
    if (e) {
        console.error('ERROR:', e.message);
    } else {
        console.log('Total scores:', r.cnt);
    }
    process.exit();
});
