const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'marcha.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Iniciando limpeza do banco de dados...");

    // 1. Limpar Tabelas Transacionais
    db.run("DELETE FROM scores", (err) => {
        if (err) console.error("Erro deletando scores:", err);
        else console.log("Scores limpos.");
    });

    db.run("DELETE FROM financial_transactions", (err) => {
        if (err) console.error("Erro deletando financeiro:", err);
        else console.log("Transações financeiras limpas.");
    });

    db.run("DELETE FROM appointments", (err) => {
        if (err) console.error("Erro deletando agendamentos:", err);
        else console.log("Agendamentos limpos.");
    });

    // 2. Limpar Entidades (Pacientes e Atletas)
    // Manter Casas e Regras conforme solicitado.
    db.run("DELETE FROM athletes", (err) => {
        if (err) console.error("Erro deletando atletas:", err);
        else console.log("Atletas limpos.");
    });

    db.run("DELETE FROM patients", (err) => {
        if (err) console.error("Erro deletando pacientes:", err);
        else console.log("Pacientes limpos.");
    });

    // 3. Resetar Sequências (Opcional, mas bom para 'Zero Km')
    const tables = ['scores', 'financial_transactions', 'appointments', 'athletes', 'patients'];
    tables.forEach(t => {
        db.run("DELETE FROM sqlite_sequence WHERE name = ?", [t]);
    });

    console.log("Limpeza concluída! Casas e Regras foram mantidas.");
});

db.close();
