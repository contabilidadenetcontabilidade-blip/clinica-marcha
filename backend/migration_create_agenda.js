const { pool } = require('./db');

async function migrate() {
    console.log('Iniciando migração da tabela agenda...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agenda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                date TEXT,
                status TEXT DEFAULT 'Pendente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            );
        `);
        console.log('Tabela agenda criada/verificada com sucesso.');
    } catch (err) {
        console.error('Erro na migração:', err);
    }
}

migrate();
