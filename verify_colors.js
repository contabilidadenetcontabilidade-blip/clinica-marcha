const db = require('./backend/db');

db.all("SELECT id, name, color, crest FROM houses", [], (err, rows) => {
    if (err) console.error(err);
    else console.log("CURRENT HOUSE DATA:", rows);
});
