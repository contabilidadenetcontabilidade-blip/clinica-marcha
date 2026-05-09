const db = require('./db');

db.serialize(() => {
    db.all("PRAGMA table_info(athletes);", [], (err, params) => {
        console.log("=== ATHLETES SCHEMA ===");
        console.log(params);

        db.all("SELECT * FROM cards;", [], (err, cards) => {
            console.log("\n=== CARDS ===");
            console.log(cards);
            process.exit(0);
        });
    });
});
