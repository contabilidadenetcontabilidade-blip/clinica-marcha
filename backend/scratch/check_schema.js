const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Marcha/backend/marcha.db');

db.all("PRAGMA table_info(scores)", (err, rows) => {
    console.log('--- scores ---');
    console.log(rows);
    db.all("PRAGMA table_info(house_points_log)", (err, rows) => {
        console.log('--- house_points_log ---');
        console.log(rows);
        db.close();
    });
});
