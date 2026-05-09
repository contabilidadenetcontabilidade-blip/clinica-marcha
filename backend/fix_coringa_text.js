const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const stealthDesc = "Por uma semana, as conquistas de um capitão adversário vão para você. (MODO STEALTH: O roubo é invisível durante 7 dias e revelado apenas no final)";

db.serialize(() => {
    db.run("UPDATE cards SET description = ? WHERE name = 'Coringa'", [stealthDesc], (err) => {
        if (err) console.error(err);
        else console.log("CORINGA DB OVERRIDE: Texto STEALTH cravado no Banco de Dados.");
    });
});
