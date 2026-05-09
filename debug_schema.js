const db = require('./backend/db');
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='house_messages'", (err, row) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('--- SCHEMA START ---');
    console.log(row ? row.sql : 'Table house_messages not found');
    console.log('--- SCHEMA END ---');
    process.exit(0);
});
