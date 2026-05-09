const db = require('./backend/db');

console.log("=== LISTANDO USUÁRIOS ===");
db.all("SELECT id, name, username, password, role FROM patients", [], (err, rows) => {
    if (err) {
        console.error("Erro:", err);
        return;
    }
    console.log(JSON.stringify(rows, null, 2));

    // Check if we have professional and student
    const admin = rows.find(r => r.role === 'admin' || r.role === 'fisio');
    const student = rows.find(r => !r.role || r.role === 'patient' || r.role === 'aluno');

    if (!admin) console.log("⚠️ AVISO: Nenhum admin/fisio encontrado!");
    if (!student) console.log("⚠️ AVISO: Nenhum aluno encontrado!");
});
