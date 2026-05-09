const { pool } = require('./db');

async function listCredentials() {
    try {
        const res = await pool.query("SELECT id, name, username, password, role FROM patients ORDER BY role DESC LIMIT 10");
        if (res.rows.length === 0) {
            console.log("Nenhum usuário encontrado.");
        } else {
            console.log("--- Credenciais Encontradas ---");
            res.rows.forEach(u => {
                console.log(`[${u.role}] Nome: ${u.name} | User: ${u.username} | Pass: ${u.password}`);
            });
        }
    } catch (err) {
        console.error("Erro ao listar credenciais:", err);
    }
}

listCredentials();
