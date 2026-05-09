const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.serialize(() => {
    db.get('SELECT count(*) as c FROM scores WHERE athlete_id = 10034', (err, r) => {
        if (err) console.error(err);
        else console.log('Scores count:', r.c);
    });
    db.get('SELECT count(*) as c FROM student_cards WHERE student_id = 10034', (err, r) => {
        if (err) console.error(err);
        else console.log('Cards count:', r.c);
    });
});
db.close();
