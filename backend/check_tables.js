const db = require('./db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    console.log("Tables:");
    console.dir(tables);

    db.all("PRAGMA table_info(scoring_rules);", [], (err, info1) => {
        console.log("scoring_rules schema:");
        console.dir(info1);

        db.all("PRAGMA table_info(rules);", [], (err, info2) => {
            console.log("rules schema:");
            console.dir(info2);

            db.all("SELECT * FROM scoring_rules", [], (err, rows1) => {
                console.log("scoring_rules data:");
                console.dir(rows1);

                db.all("SELECT * FROM rules", [], (err, rows2) => {
                    console.log("rules data:");
                    console.dir(rows2);
                    process.exit(0);
                });
            });
        });
    });
});
