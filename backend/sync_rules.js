const db = require('./db');

db.serialize(() => {
    // We wipe scoring_rules and populate it from rules so IDs match perfectly.
    // Important: Temporarily turn off FKs just in case, though scores might have references.
    db.run("PRAGMA foreign_keys = OFF;");
    db.run("DELETE FROM scoring_rules;");
    db.all("SELECT * FROM rules;", [], (err, rows) => {
        if (err) throw err;

        const stmt = db.prepare("INSERT INTO scoring_rules (id, name, value, category, active) VALUES (?, ?, ?, 'Geral', 1)");
        rows.forEach(r => {
            stmt.run(r.id, r.name, r.value);
        });
        stmt.finalize(() => {
            // Include Adhoc rule 99 used by import and others if Motivo not found
            db.run("INSERT OR IGNORE INTO scoring_rules (id, name, value, category, active) VALUES (99, 'Adhoc / Extra', 0, 'Sistema', 1)", () => {
                db.run("PRAGMA foreign_keys = ON;");
                console.log("Scoring rules synced!");
                process.exit(0);
            });
        });
    });
});
