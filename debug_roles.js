const db = require('./backend/db');

console.log("=== CHECKING ROLES ===");

db.serialize(() => {
    // Check distinct roles
    db.all("SELECT DISTINCT role FROM patients", [], (err, rows) => {
        if (err) console.error("Erro Distinct Role:", err);
        else console.log("ROLES FOUND:", rows);
    });

    // Try the FIXED query (Name filter only)
    const query = "SELECT * FROM patients WHERE 1=1 AND name NOT LIKE '%Admin%' AND name NOT LIKE '%Coord%' AND name != 'Administrador'";
    db.all(query, [], (err, rows) => {
        if (err) console.error("QUERY FAILED:", err.message);
        else console.log("QUERY SUCCESS. Rows:", rows.length);
    });
});
