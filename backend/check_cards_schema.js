const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite', sqlite3.OPEN_READONLY);

db.all('PRAGMA table_info(cards)', (err, rows) => {
    console.log('CARDS SCHEMA:', rows);
});

db.all('PRAGMA table_info(card_effects)', (err, rows) => {
    console.log('CARD_EFFECTS SCHEMA:', rows);
});

db.all('SELECT * FROM cards LIMIT 1', (err, rows) => {
    console.log('CARDS SAMPLE:', rows);
});

db.close();
