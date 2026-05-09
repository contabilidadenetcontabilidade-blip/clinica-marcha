const db = require('../db');
db.all("SELECT id, name, role FROM patients WHERE role = 'admin' OR id = 9999", [], (e, r) => {
    console.log('ADMINS FOUND:', r);
    process.exit();
});
