const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.serialize(() => {
    // Tarefa 1: Update patients
    db.run(`
        UPDATE patients 
        SET username = name, 
            password = '123', 
            password_changed = 0 
        WHERE role = 'atleta' AND username IS NULL
    `, function(err) {
        if (err) {
            console.error('Erro no UPDATE:', err.message);
        } else {
            console.log('UPDATE concluído. Registros alterados:', this.changes);
        }
    });

    // Confirmação
    db.get(`
        SELECT count(*) as count FROM patients WHERE role = 'atleta' AND username IS NOT NULL
    `, (err, row) => {
        if (err) {
            console.error('Erro na verificação:', err.message);
        } else {
            console.log('Confirmação - Atletas com username:', row.count);
        }
        db.close();
    });
});
