const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
db.all("SELECT hm.id, hm.house_id, hm.timestamp, p.name as sender_name FROM house_messages hm LEFT JOIN patients p ON hm.patient_id = p.id ORDER BY hm.timestamp DESC LIMIT 5", [], (err, rows) => {
    if (err) console.error(err);
    console.log("MENSAGENS NO BANCO:", rows);
    db.close();
});
