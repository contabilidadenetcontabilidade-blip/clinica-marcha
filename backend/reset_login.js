const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Apagar 'tamara'
    db.run("DELETE FROM patients WHERE username = 'tamara'", function (err) {
        if (err) console.error("Erro ao deletar:", err.message);
        else console.log(`Deletado(s): ${this.changes}`);
    });

    // 2. Inserir 'tamara' com senha '123456' e active=1
    // Atenção: campos obrigatórios no schema (name, username, password, role, active, house_id)
    const sql = `INSERT INTO patients (name, username, password, role, active, house_id, photo) 
                 VALUES ('Tamara Coord', 'tamara', '123456', 'admin', 1, NULL, NULL)`;

    db.run(sql, function (err) {
        if (err) console.error("Erro ao inserir:", err.message);
        else console.log(`Inserido com sucesso. ID: ${this.lastID}`);
    });
});

db.close();
