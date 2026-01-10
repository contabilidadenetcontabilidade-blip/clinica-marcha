const db = require('./backend/db');

// Aguarda conexão
setTimeout(() => {
    console.log("Definindo senha para o aluno de teste...");
    db.run("UPDATE patients SET password = '1234', role = 'aluno' WHERE name = 'Teste Browser'", function (err) {
        if (err) {
            console.error("Erro:", err);
        } else {
            if (this.changes > 0) {
                console.log("SUCESSO: Senha '1234' definida para 'Teste Browser'");
            } else {
                console.log("AVISO: Usuário 'Teste Browser' não encontrado. Crie-o primeiro se quiser testar o login de aluno.");
                // Fallback: Create it if not exists for the user to test
                db.run("INSERT INTO patients (name, type, role, password) VALUES ('Teste Browser', 'Aluno', 'aluno', '1234')");
                console.log("Criado usuário 'Teste Browser' com senha '1234'");
            }
        }
        // Force exit after a bit
        setTimeout(() => process.exit(0), 500);
    });
}, 1000);
