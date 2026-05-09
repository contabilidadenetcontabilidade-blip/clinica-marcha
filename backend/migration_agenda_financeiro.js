const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
});

console.log('Iniciando migração AGENDA & FINANCEIRO...');

db.serialize(() => {
    // Adicionar makeup_resolved em appointments
    db.run(`ALTER TABLE appointments ADD COLUMN makeup_resolved INTEGER DEFAULT 0`, [], function (err) {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna makeup_resolved já existe em appointments.');
            } else {
                console.error('Erro ao adicionar makeup_resolved:', err);
            }
        } else {
            console.log('Coluna makeup_resolved adicionada com sucesso.');
        }
    });

    // Adicionar bonus_pack em financial_transactions
    db.run(`ALTER TABLE financial_transactions ADD COLUMN bonus_pack INTEGER DEFAULT 0`, [], function (err) {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna bonus_pack já existe em financial_transactions.');
            } else {
                console.error('Erro ao adicionar bonus_pack:', err);
            }
        } else {
            console.log('Coluna bonus_pack adicionada com sucesso.');
        }
    });
});

// Aguardar um pouco para garantir que as queries terminem antes de fechar o script
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
            console.log('Migração concluída.');
        }
    });
}, 1000);
