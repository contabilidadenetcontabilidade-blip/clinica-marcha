const db = require('./backend/db');

console.log("=== CHECKING SCHEMA ===");

db.all("PRAGMA table_info(cards)", [], (err, rows) => {
    if (err) console.error("Error checking cards:", err);
    else console.log("Cards Table:", rows);
});

db.all("SELECT * FROM cards", [], (err, rows) => {
    if (err) console.error("Error select cards:", err);
    else console.log("Cards Data:", rows);
});
