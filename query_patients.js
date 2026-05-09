const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = 'C:\\Marcha\\database.sqlite';

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Erro ao abrir banco:', err.message);
        process.exit(1);
    }
});

db.all('SELECT id, name, username, role, house_id FROM patients ORDER BY id LIMIT 20', (err, rows) => {
    if (err) {
        console.error('Erro na query:', err.message);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
