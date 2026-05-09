const db = require('./backend/db');

console.log("=== DEBUGGING PATIENTS TABLE ===");

db.serialize(() => {
    // 1. Check Columns
    db.all("PRAGMA table_info(patients)", [], (err, rows) => {
        if (err) {
            console.error("Erro PRAGMA:", err);
            return;
        }
        console.log("COLUMNS:", rows.map(r => r.name));

        const hasType = rows.some(r => r.name === 'type');
        if (!hasType) {
            console.error("CRITICAL: Column 'type' DOES NOT EXIST in patients table!");
            console.log("Removing faulty filter from index.js...");
        } else {
            console.log("Column 'type' exists. Checking values...");
            // 2. Check Data
            db.all("SELECT id, name, type FROM patients LIMIT 10", [], (err, users) => {
                if (err) console.error("Error Select:", err);
                else console.log("SAMPLE DATA:", users);
            });
        }
    });

    // 3. Try the failing query
    const query = "SELECT * FROM patients WHERE 1=1 AND name NOT LIKE '%Admin%' AND type IN ('Paciente', 'Aluno')";
    db.all(query, [], (err, rows) => {
        if (err) console.error("QUERY FAILED:", err.message);
        else console.log("QUERY SUCCESS. Rows:", rows.length);
    });
});
