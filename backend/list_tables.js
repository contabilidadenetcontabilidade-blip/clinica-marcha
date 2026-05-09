const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Marcha/database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
