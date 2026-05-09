const db = require('./db');

db.all("SELECT id, name, role FROM professionals", [], (err, rows) => {
    if (err) console.error(err);
    console.log("Professionals:", rows);
});

db.all("SELECT id, name FROM patients WHERE id IN (1, 9999, 90, 91, 10009)", [], (err, rows) => {
    if (err) console.error(err);
    console.log("Patients (Alunos):", rows);
    process.exit(0);
});
