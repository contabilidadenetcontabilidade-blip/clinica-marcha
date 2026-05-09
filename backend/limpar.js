const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const backupPath = path.join(__dirname, '..', 'marcha_backup_pre_limpeza.sqlite');

try {
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ BACKUP DE SEGURANÇA REALIZADO: database_backup_pre_limpeza.sqlite');
} catch (err) {
    console.error('❌ ERRO NO BACKUP:', err);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ ERRO AO CONECTAR NO BANCO:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run(`DELETE FROM appointments;`, function (err) {
        if (err) {
            console.error('❌ Erro deletando agendamentos:', err);
        } else {
            console.log(`✅ Agendamentos deletados. Linhas afetadas: ${this.changes}`);
        }
    });

    db.run(`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'appointments';`, function (err) {
        if (err) {
            console.log('A tabela sqlite_sequence pode não existir ou não rastrear appointments.');
        } else {
            console.log(`✅ Sequência reiniciada. Linhas afetadas: ${this.changes}`);
        }
    });

    db.get(`SELECT COUNT(*) as count FROM patients`, (err, row) => {
        if (err) {
            console.error('❌ Erro checando pacientes:', err);
        } else {
            console.log(`✅ INTEGRIDADE DOS PACIENTES: ${row.count} pacientes mantidos.`);
        }
    });
});

db.close((err) => {
    if (err) console.error(err);
    console.log('Fechando banco de dados após a limpeza.');
});
