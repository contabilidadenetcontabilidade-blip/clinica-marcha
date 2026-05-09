const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.all("SELECT username, password, name FROM patients WHERE name LIKE '%Glaubert%'", [], (err, rows) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
