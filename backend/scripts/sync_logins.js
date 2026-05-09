const db = require('../db');

async function sync() {
    console.log('--- Syncing Professionals to Patients table ---');

    // 1. Get all active professionals
    db.all("SELECT * FROM professionals WHERE active = 1", [], (err, pros) => {
        if (err) return console.error(err);

        pros.forEach(pro => {
            db.get("SELECT id FROM patients WHERE name = ?", [pro.name], (err, pat) => {
                const role = pro.specialty === 'Administração' ? 'admin' : 'fisio';
                if (!pat) {
                    console.log(`Adding Professional: ${pro.name}`);
                    db.run(`INSERT INTO patients (name, username, password, role, type, active) VALUES (?, ?, ?, ?, ?, 1)`,
                        [pro.name, pro.name, '123', role, 'Profissional']);
                } else {
                    console.log(`Professional already exists: ${pro.name}. Updating credentials...`);
                    db.run(`UPDATE patients SET username = ?, password = ?, role = ?, type = 'Profissional' WHERE id = ?`,
                        [pro.name, '123', role, pat.id]);
                }
            });
        });
    });

    // 2. Update Students/Patients one by one to avoid unique constraint issues
    db.all("SELECT id, name FROM patients WHERE role IS NOT 'admin' AND role IS NOT 'fisio'", [], (err, rows) => {
        if (err) return console.error(err);

        rows.forEach(row => {
            let baseUsername = row.name.trim();
            // Try updating username to name. If it fails, use name + ID
            db.run(`UPDATE patients SET username = ?, password = '123' WHERE id = ?`, [baseUsername, row.id], function (err) {
                if (err && err.message.includes('UNIQUE')) {
                    const uniqueUsername = `${baseUsername}_${row.id}`;
                    console.log(`Username conflict for ${baseUsername}, using ${uniqueUsername}`);
                    db.run(`UPDATE patients SET username = ?, password = '123' WHERE id = ?`, [uniqueUsername, row.id]);
                }
            });
        });
    });

    // 3. Final safety update for all passwords
    db.run(`UPDATE patients SET password = '123'`);
}

sync();
setTimeout(() => {
    console.log('Sync complete.');
    process.exit(0);
}, 3000);
