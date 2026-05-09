const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
console.log(`🔌 Conectando ao banco: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Garantir que as colunas existem (Migração de Emergência)
    console.log("🛠️  Verificando estrutura da tabela 'patients'...");

    // Lista de colunas críticas para login
    const columns = [
        { name: 'username', type: 'TEXT' },
        { name: 'password', type: 'TEXT' },
        { name: 'role', type: 'TEXT DEFAULT "aluno"' }
    ];

    columns.forEach(col => {
        const sql = `ALTER TABLE patients ADD COLUMN ${col.name} ${col.type}`;
        db.run(sql, (err) => {
            if (err && err.message.includes('duplicate column')) {
                // Ignorar se já existe
            } else if (err) {
                console.error(`❌ Erro ao adicionar coluna ${col.name}:`, err.message);
            } else {
                console.log(`✅ Coluna '${col.name}' adicionada.`);
            }
        });
    });

    // 2. Criar/Atualizar Usuário Admin
    const adminUser = {
        name: 'Tamara',
        username: 'tamara',
        password: 'marcha2026', // Texto plano conforme verificado no index.js
        role: 'admin',
        type: 'Fisioterapeuta',
        phone: '999999999'
    };

    console.log(`👤 Criando usuário Admin: ${adminUser.username}...`);

    db.get("SELECT id FROM patients WHERE username = ?", [adminUser.username], (err, row) => {
        if (err) {
            console.error(err);
            return;
        }

        if (row) {
            console.log("🔄 Usuário já existe. Atualizando senha e permissões...");
            db.run(`
                UPDATE patients 
                SET password = ?, role = ?, type = ?, active = 1 
                WHERE id = ?
            `, [adminUser.password, adminUser.role, adminUser.type, row.id], (err) => {
                if (err) console.error(err);
                else console.log("✅ Admin Atualizado com Sucesso!");
            });
        } else {
            console.log("✨ Criando novo usuário...");
            db.run(`
                INSERT INTO patients (name, username, password, role, type, phone, active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            `, [adminUser.name, adminUser.username, adminUser.password, adminUser.role, adminUser.type, adminUser.phone], (err) => {
                if (err) console.error(err);
                else console.log("✅ Admin Criado com Sucesso!");
                db.close(() => {
                    console.log("🔒 Conexão fechada.");
                });
            });
        }
    });

});
