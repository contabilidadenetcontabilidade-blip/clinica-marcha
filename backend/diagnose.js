const db = require('./db');
db.serialize(() => {
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('scores', 'rules', 'scoring_rules', 'athletes', 'patients');", [], (err, schemas) => {
        console.log("=== SCHEMAS ===");
        schemas.forEach(s => console.log(s.sql));

        db.all("SELECT * FROM rules LIMIT 5;", [], (err, rulesTable) => {
            console.log("\n=== RULES TABLE ===");
            console.log(rulesTable);

            db.all("SELECT * FROM scoring_rules LIMIT 5;", [], (err, scoringRulesTable) => {
                console.log("\n=== SCORING_RULES TABLE ===");
                console.log(scoringRulesTable);

                db.all("SELECT * FROM athletes LIMIT 5;", [], (err, athletes) => {
                    console.log("\n=== ATHLETES TABLE ===");
                    console.log(athletes);
                    process.exit(0);
                });
            });
        });
    });
});
