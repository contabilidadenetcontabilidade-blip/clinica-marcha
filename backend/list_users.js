const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`📂 Lendo banco: ${dbPath}`);

db.all("SELECT id, name, username, password, role FROM patients", (err, rows) => {
    if (err) {
        console.error("❌ ERRO AO LER:", err.message);
    } else {
        console.log("✅ Usuários encontrados:");
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
