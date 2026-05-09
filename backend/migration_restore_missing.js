const { pool } = require('./db');

async function migrate() {
    console.log('--- Verificando/Criando tabelas do Backup (09/01) ---');

    const queries = [
        `CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          appointment_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME,
          service_type TEXT NOT NULL, 
          professional TEXT,
          status TEXT DEFAULT 'agendado',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (patient_id) REFERENCES patients(id)
        );`,
        `CREATE TABLE IF NOT EXISTS financial_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL, 
          category TEXT, 
          description TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          due_date DATE,
          payment_date DATE,
          payment_method TEXT,
          patient_id INTEGER,
          appointment_id INTEGER,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        );`,
        `CREATE TABLE IF NOT EXISTS athletes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          house_id INTEGER NOT NULL,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (house_id) REFERENCES houses(id)
        );`,
        `CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          athlete_id INTEGER NOT NULL,
          rule_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (athlete_id) REFERENCES athletes(id),
          FOREIGN KEY (rule_id) REFERENCES scoring_rules(id)
        );`
    ];

    for (const sql of queries) {
        try {
            await pool.query(sql);
            console.log('Comando executado com sucesso.');
        } catch (err) {
            console.error('Erro ao executar SQL:', err.message);
        }
    }
    console.log('Migração concluída.');
}

migrate();
