const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Marcha/database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE card_queue ADD COLUMN allied_captain_id INTEGER;", (err) => {
    if (err) console.error("Erro allied_captain_id:", err.message);
    else console.log("Coluna allied_captain_id adicionada.");
  });
  
  db.run("ALTER TABLE card_queue ADD COLUMN invoker_house_id INTEGER;", (err) => {
    if (err) console.error("Erro invoker_house_id:", err.message);
    else console.log("Coluna invoker_house_id adicionada.");
  });
});

db.close();
