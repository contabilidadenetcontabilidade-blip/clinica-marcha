const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.all("SELECT * FROM scoring_rules", [], (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
