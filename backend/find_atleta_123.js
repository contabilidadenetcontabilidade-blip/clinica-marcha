const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

db.all("SELECT p.username, p.password, p.name FROM patients p JOIN athletes a ON p.id = a.patient_id WHERE p.password = '123' LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
