const db = require('../backend/db');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'", (err, rows) => {
    if (err) console.error(err);
    else console.log('ATTENDANCE:', rows.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
    process.exit(0);
});
