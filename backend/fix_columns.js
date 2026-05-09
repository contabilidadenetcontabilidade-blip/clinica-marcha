const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function exec(sql) {
    return new Promise((resolve) => {
        db.run(sql, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.log(`⚠️  ${err.message}`);
            }
            resolve();
        });
    });
}

async function fixDatabase() {
    console.log('🔧 Corrigindo estrutura do banco...\n');

    // Adicionar coluna photo em patients
    await exec('ALTER TABLE patients ADD COLUMN photo TEXT');
    console.log('✅ Coluna photo adicionada em patients');

    // Adicionar coluna hash_id em house_points_log
    await exec('ALTER TABLE house_points_log ADD COLUMN hash_id TEXT UNIQUE');
    console.log('✅ Coluna hash_id adicionada em house_points_log');

    // Adicionar coluna hash_id em scores (se necessário)
    await exec('ALTER TABLE scores ADD COLUMN hash_id TEXT');
    console.log('✅ Coluna hash_id adicionada em scores');

    // Garantir que hash_code existe em active_cards
    await exec('ALTER TABLE active_cards ADD COLUMN hash_code TEXT');
    await exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards_hash ON active_cards(hash_code)');
    console.log('✅ Sistema de hash verificado em active_cards');

    console.log('\n✅ Estrutura do banco corrigida!\n');

    db.close();
}

fixDatabase();
