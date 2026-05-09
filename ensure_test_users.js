const db = require('./backend/db');

console.log("=== GARANTINDO USUÁRIOS DE TESTE ===");

db.serialize(() => {
    // 1. Admin/Fisio
    db.run(`INSERT OR IGNORE INTO patients (name, username, password, role, active) 
            VALUES ('Administrador', 'admin', 'admin123', 'admin', 1)`);

    // 2. Aluno/Paciente
    db.run(`INSERT OR IGNORE INTO patients (name, username, password, role, active) 
            VALUES ('Aluno Teste', 'aluno', 'aluno123', 'patient', 1)`);

    console.log("Usuários de teste inseridos/verificados.");

    // Check
    db.all("SELECT username, role, password FROM patients WHERE username IN ('admin', 'aluno')", [], (err, rows) => {
        if (err) console.error(err);
        else console.log("Usuários ativos:", rows);
    });
});
