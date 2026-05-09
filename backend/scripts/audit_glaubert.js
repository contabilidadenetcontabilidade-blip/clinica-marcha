const db = require('../db');

const tables = [
    'patients', 'professionals', 'houses', 'athletes',
    'scoring_rules', 'scores', 'house_points_log',
    'appointments', 'financial_transactions'
];

async function audit() {
    console.log('--- GLOBAL SEARCH FOR "Glaubert" ---');

    // Also check for 'users' table if it exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, rows) => {
        if (rows && rows.length > 0) {
            console.log('Table "users" exists. Searching...');
            db.all("SELECT * FROM users WHERE name LIKE '%Glaubert%' OR username LIKE '%Glaubert%'", (err, results) => {
                if (err) console.error(err);
                else console.table(results);
            });
        }
    });

    tables.forEach(table => {
        db.all(`PRAGMA table_info(${table})`, (err, cols) => {
            if (err) return;
            const textCols = cols.filter(c => c.type === 'TEXT').map(c => c.name);
            if (textCols.length === 0) return;

            const whereClause = textCols.map(c => `${c} LIKE '%Glaubert%'`).join(' OR ');
            db.all(`SELECT * FROM ${table} WHERE ${whereClause}`, (err, rows) => {
                if (err) {
                    // console.error(`Error searching ${table}:`, err.message);
                } else if (rows && rows.length > 0) {
                    console.log(`Found in table: ${table}`);
                    console.table(rows);
                }
            });
        });
    });

    // Check inventory specifically if table exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'", (err, rows) => {
        if (rows && rows.length > 0) {
            console.log('Table "inventory" exists. Searching...');
            db.all("SELECT * FROM inventory", (err, results) => {
                if (err) console.error(err);
                else console.table(results);
            });
        }
    });
}

audit();

setTimeout(() => {
    console.log('Audit complete.');
    process.exit(0);
}, 5000);
