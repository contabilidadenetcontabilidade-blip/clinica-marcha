const db = require('../db');
const fs = require('fs');
const path = require('path');

async function check() {
    console.log('--- Table: patients ---');
    db.all("PRAGMA table_info(patients)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log('--- Table: professionals ---');
    db.all("PRAGMA table_info(professionals)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    // Check for 'public' folder
    const publicPath = path.join(__dirname, '..', '..', 'public');
    if (fs.existsSync(publicPath)) {
        console.log('Folder "public" exists.');
    } else {
        console.log('Folder "public" does NOT exist.');
    }
}

check();
// Small delay to ensure DB calls finish before script exit
setTimeout(() => { }, 2000);
