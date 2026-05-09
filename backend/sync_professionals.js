const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Iniciando sincronização de profissionais...');

db.serialize(() => {
    // 1. Encontrar o staff legado
    db.all(`SELECT id, name FROM patients WHERE role IN ('admin', 'coord', 'master') OR name IN ('Beto Admin', 'Lola Coord', 'Glaubert Admin', 'Tamara', 'Administrador') OR is_admin = 1`, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar patients:', err);
            process.exit(1);
        }

        console.log(`Encontrados ${rows.length} membros da equipe no banco de pacientes.`);

        // Preparar inserção segura
        const stmt = db.prepare(`INSERT INTO professionals (name, specialty, color, active) SELECT ?, 'Administração', '#607d8b', 1 WHERE NOT EXISTS (SELECT 1 FROM professionals WHERE name = ?)`);

        let count = 0;
        rows.forEach(row => {
            stmt.run([row.name, row.name], function (e) {
                if (e) console.error('Erro ao inserir', row.name, e.message);
                if (this.changes > 0) {
                    console.log(`✅ ${row.name} sincronizado na tabela professionals.`);
                }
            });
            count++;
        });

        stmt.finalize(() => {
            console.log('Processo de sincronização concluído com segurança.');
            db.close();
        });
    });
});
