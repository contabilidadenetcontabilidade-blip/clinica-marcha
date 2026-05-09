const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const backupPath = path.join(__dirname, 'backend', 'database_backup_pre_limpeza.sqlite');

// 1. BACKUP
try {
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ BACKUP DE SEGURANÇA REALIZADO: database_backup_pre_limpeza.sqlite');
} catch (err) {
    console.error('❌ ERRO NO BACKUP:', err);
    process.exit(1);
}

// 2. EXECUÇÃO SQL CONTROLADA
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ ERRO AO CONECTAR NO BANCO:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    // DELETE FROM appointments
    db.run(`DELETE FROM appointments;`, function (err) {
        if (err) {
            console.error('❌ Erro deletando agendamentos:', err);
        } else {
            console.log(`✅ Agendamentos deletados. Linhas afetadas: ${this.changes}`);
        }
    });

    // Reset sqlite_sequence
    db.run(`UPDATE sqlite_sequence SET seq = 0 WHERE name = 'appointments';`, function (err) {
        if (err) {
            // A tabela sqlite_sequence pode não ter a entrada se não houver auto increment antes
            console.log('Tabela sqlite_sequence ignorou appointments (talvez já em 0).');
        } else {
            console.log(`✅ Sequência reiniciada. Linhas afetadas: ${this.changes}`);
        }
    });

    // VALIDAÇÃO: Check se pacientes continuam lá
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
