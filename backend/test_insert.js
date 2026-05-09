const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Testing insert exactly as in index.js');
const sanitizedName = 'Test Final';
const cpf = '99988877766';
const phone = null, email = null, birth_date = null, address = null, city = null, state = null;
const zip_code = null, emergency_contact = null, emergency_phone = null, health_insurance = null, health_insurance_number = null, notes = null;

db.run(
    `INSERT INTO patients (name, cpf, phone, email, birth_date, address, city, state, zip_code,
                          emergency_contact, emergency_phone, health_insurance, health_insurance_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sanitizedName, cpf || null, phone || null, email || null, birth_date || null,
        address || null, city || null, state || null, zip_code || null,
        emergency_contact || null, emergency_phone || null, health_insurance || null,
        health_insurance_number || null, notes || null],
    function (err) {
        if (err) {
            console.error("Erro EXATO ao criar paciente:", err);
        } else {
            console.log("Success! ID:", this.lastID);
        }
    }
);
