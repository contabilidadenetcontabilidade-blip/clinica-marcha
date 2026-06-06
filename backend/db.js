const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error("Erro ao conectar no banco:", err.message);
  else console.log("Conectado ao banco de dados SQLite oficial.");
});

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), "utf8");
db.exec(schema, (err) => {
  if (err) console.error("Erro ao criar as tabelas:", err);
  else console.log("Banco pronto e tabelas criadas!");
});

// Startup migration: garantir coluna deleted_at em athletes (idempotente)
db.run("ALTER TABLE athletes ADD COLUMN deleted_at DATETIME", [], (err) => {
  if (err) {
    const msg = (err && err.message) ? err.message.toLowerCase() : '';
    // Mensagem esperada quando a coluna já existe: 'duplicate column name' ou similar
    if (msg.includes('duplicate column') || msg.includes('duplicate column name') || msg.includes('already exists')) {
      console.log('Coluna deleted_at já existe em athletes. Ignorando.');
    } else {
      console.warn('Erro ao adicionar coluna deleted_at em athletes:', err.message);
    }
  } else {
    console.log('Coluna deleted_at adicionada em athletes (migração de startup).');
  }
});

module.exports = db;
