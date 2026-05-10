const db = require('../backend/db');
db.serialize(() => {
    db.run("DELETE FROM scores");
    db.run("UPDATE athletes SET is_captain = 0");
    db.run("DELETE FROM meta_meinhas");
    
    const metas = [];
    for (let h = 1; h <= 5; h++) {
        for (let m = 3; m <= 11; m++) {
            metas.push({ h, m: m.toString().padStart(2, '0') });
        }
    }
    const stmt = db.prepare("INSERT INTO meta_meinhas (house_id, month, year, target) VALUES (?, ?, 2026, 250)");
    metas.forEach(meta => stmt.run(meta.h, meta.m));
    stmt.finalize();

    db.all("SELECT COUNT(*) as count FROM athletes", (err, rows) => console.log("Atletas:", rows[0].count));
    db.all("SELECT COUNT(*) as count FROM scoring_rules", (err, rows) => console.log("Regras:", rows[0].count));
    db.all("SELECT COUNT(*) as count FROM meta_meinhas", (err, rows) => {
        console.log("Metas:", rows[0].count);
        process.exit();
    });
});
