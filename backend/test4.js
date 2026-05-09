const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../database.sqlite');
db.all("SELECT id, name, rarity FROM cards", [], (err, rows) => {
    console.log("Cartas na DB:", rows);
});
