const db = require('./db');
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Tables:", rows.map(t => t.name).join(', '));
    process.exit(0);
});
