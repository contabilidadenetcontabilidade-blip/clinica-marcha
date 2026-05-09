const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
db.serialize(() => {
    db.all("SELECT * FROM houses ORDER BY id DESC LIMIT 2", (err, rows) => console.log("HOUSES:", rows));
    db.all("SELECT * FROM card_queue", (err, rows) => console.log("CARD QUEUE:", rows));
    db.all("SELECT * FROM house_points_log ORDER BY id DESC LIMIT 5", (err, rows) => console.log("LOGS:", rows));
});
