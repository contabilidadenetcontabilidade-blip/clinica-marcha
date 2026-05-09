const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Verificando contagem de atletas por casa...");

db.all(`
    SELECT h.name as house, COUNT(a.id) as total 
    FROM houses h 
    LEFT JOIN athletes a ON h.id = a.house_id 
    GROUP BY h.id
`, (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("CONTAGEM POR CASA:");
        rows.forEach(r => console.log(`${r.house}: ${r.total}`));
    }
    
    db.get("SELECT COUNT(*) as count FROM athletes", (err, row) => {
        console.log(`\nTotal de atletas no banco: ${row.count}`);
        db.close();
    });
});
