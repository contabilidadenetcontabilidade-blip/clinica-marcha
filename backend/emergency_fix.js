const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database.sqlite');
console.log('Using DB:', dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Add missing columns safely
    ['cpf', 'type', 'username', 'password', 'role'].forEach(col => {
        const sql = `ALTER TABLE patients ADD COLUMN ${col} TEXT`;
        db.run(sql, (err) => {
            if (err) {
                if (err.message.includes('duplicate column')) {
                    console.log(`Column ${col} already exists.`);
                } else {
                    console.error(`Error adding column ${col}:`, err.message);
                }
            } else {
                console.log(`Column ${col} added successfully.`);
            }
        });
    });

    // 2. Fix card image names in DB exactly matching the filesystem
    db.run("UPDATE cards SET image_path = REPLACE(image_path, '.jpg', '.jpeg') WHERE image_path LIKE '%.jpg'");
    db.run("UPDATE cards SET image_path = '/cartas/coringa.jpeg' WHERE image_path LIKE '%curinga%'");
    db.run("UPDATE cards SET image_path = '/cartas/golpe de estado.jpeg' WHERE image_path LIKE '%golpe%'");
    db.run("UPDATE cards SET image_path = '/cartas/influencer.jpeg' WHERE image_path LIKE '%influenciador%'");
    db.run("UPDATE cards SET image_path = '/cartas/ladino.jpeg' WHERE image_path LIKE '%ladrao%'");
    db.run("UPDATE cards SET image_path = '/cartas/marombinha.jpeg' WHERE image_path LIKE '%maromba%'");
    db.run("UPDATE cards SET image_path = '/cartas/senhorinha.jpeg' WHERE image_path LIKE '%senhor%'");

    db.run("UPDATE cards SET image_path = REPLACE(image_path, '/assets/cards/', '/cartas/') WHERE image_path LIKE '/assets/cards/%'");
    db.run("UPDATE cards SET image_path = REPLACE(image_path, '/api/cards/image/', '/cartas/') WHERE image_path LIKE '/api/cards/image/%'");

    // Update patient credentials for tamara to test
    db.run("INSERT OR REPLACE INTO patients (id, name, username, password, role, active) VALUES (9999, 'Tamara', 'tamara', 'marcha2026', 'admin', 1)");

    console.log("Database fixes applied.");
});
