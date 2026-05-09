const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking database at:', dbPath);

db.run('ALTER TABLE patients ADD COLUMN cpf TEXT;', (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column cpf already exists.');
        } else {
            console.error('Error adding column:', err.message);
        }
    } else {
        console.log('Column cpf added successfully.');
    }

    // Test insert
    db.run("INSERT INTO patients (name, cpf) VALUES ('Test Automated Patient', '12345678901')", function (err) {
        if (err) {
            console.error('Insert error:', err.message);
        } else {
            console.log('Test patient inserted with ID:', this.lastID);
        }
    });
});
