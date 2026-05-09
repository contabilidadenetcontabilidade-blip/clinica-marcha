const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite', sqlite3.OPEN_READONLY);

const names = [
    'Spoiler', 'Vida', 'Senhorinha', 'Marombinha', 'Ladino', 'Reverso', 
    'Influencer', 'Zica', 'Coringa', 'Trapaça', 'VAR', 'Tandera', 
    'Invisibilidade', 'Aliança', 'Golpe de Estado', 'Pomo', 'Mídias sociais'
];

const placeholders = names.map(() => '?').join(',');
const query = `SELECT name, description FROM cards WHERE name IN (${placeholders})`;

db.all(query, names, (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
