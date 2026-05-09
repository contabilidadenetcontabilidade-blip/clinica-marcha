const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.serialize(() => {
    // Adicionar 'password' se já não existir
    db.run(`ALTER TABLE patients ADD COLUMN password TEXT`, (err) => {
        if (err) console.log("Coluna password:", err.message);
        else console.log("Coluna password adicionada.");
    });
    // Adicionar 'password_changed'
    db.run(`ALTER TABLE patients ADD COLUMN password_changed INTEGER DEFAULT 0`, (err) => {
        if (err) console.log("Coluna password_changed:", err.message);
        else console.log("Coluna password_changed adicionada.");
    });

    // Atualizar quem não tiver senha para '123'
    db.run(`UPDATE patients SET password = '123' WHERE password IS NULL OR password = ''`, (err) => {
        if (err) console.log("Erro ao atualizar base de senhas", err.message);
        else console.log("Definiu senhas default '123' para pacientes sem senha.");
    });
});
db.close();
