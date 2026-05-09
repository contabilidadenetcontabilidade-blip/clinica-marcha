const db = require('./backend/db');

console.log("=== FIXING HOUSE COLORS ===");

db.serialize(() => {
    // 1. Fix Barrel -> 
    // Wait, Pilates Theme? Barrel, Reformer, Cadilac, Chair.
    // User said: "Casa Barrel: Cor de destaque deve ser Vermelho."
    // "Casa Reformer: Cor de destaque deve ser Verde."

    // Updating Barrel
    db.run("UPDATE houses SET color = '#e74c3c' WHERE name LIKE '%Barrel%'", function (err) {
        if (err) console.error("Error updating Barrel:", err);
        else console.log(`Barrel updated (changes: ${this.changes})`);
    });

    // Updating Reformer
    db.run("UPDATE houses SET color = '#2ecc71' WHERE name LIKE '%Reformer%'", function (err) {
        if (err) console.error("Error updating Reformer:", err);
        else console.log(`Reformer updated (changes: ${this.changes})`);
    });

    // Verify
    db.all("SELECT * FROM houses", [], (err, rows) => {
        if (err) console.error(err);
        else console.log("Final Houses State:", rows);
    });
});
