const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("🔥 INICIANDO ATUALIZAÇÃO DE CORES (DB) 🔥");

db.serialize(() => {
    // Chair -> Amarelo (#FFFF00)
    db.run("UPDATE houses SET color = '#FFFF00' WHERE name = 'Chair' COLLATE NOCASE", (err) => {
        if (err) console.error("Erro na Chair:", err);
        else console.log("   --> [SUCESSO] Casa 'Chair' atualizada para Amarelo (#FFFF00).");
    });

    // Joseph -> Laranja (#FFA500)
    db.run("UPDATE houses SET color = '#FFA500' WHERE name = 'Joseph' COLLATE NOCASE", (err) => {
        if (err) console.error("Erro em Joseph:", err);
        else console.log("   --> [SUCESSO] Casa 'Joseph' atualizada para Laranja (#FFA500).");
    });

    // Check results
    setTimeout(() => {
        db.all("SELECT id, name, color FROM houses", [], (err, rows) => {
            console.log("\nCores atuais no DB:");
            console.table(rows);
        });
    }, 500);
});
