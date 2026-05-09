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

module.exports = db;
