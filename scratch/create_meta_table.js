const db = require('../backend/db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS meta_meinhas (
        id INTEGER PRIMARY KEY,
        house_id INTEGER,
        month TEXT,
        year INTEGER,
        target INTEGER
    )`, (err) => {
        if (err) console.error(err);
        else console.log("Tabela meta_meinhas criada com sucesso.");
        process.exit(0);
    });
});
