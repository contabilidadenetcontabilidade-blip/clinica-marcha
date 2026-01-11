const { pool } = require('../db');

const housesList = [
    { name: 'Barrel', color: '#FB8C00' }, // Gold/Orange
    { name: 'Cadillac', color: '#1E88E5' }, // Blue
    { name: 'Chair', color: '#43A047' }, // Green
    { name: 'Joseph Pilates', color: '#8E24AA' }, // Purple
    { name: 'Reformer', color: '#E53935' } // Red
];

async function updateDB() {
    console.log("🚀 Iniciando atualização do banco de dados...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Atualizar Tabela Patients (Adicionar username)
        console.log("📦 Verificando tabela patients...");
        try {
            await client.query("ALTER TABLE patients ADD COLUMN username TEXT UNIQUE");
            console.log("✅ Coluna 'username' adicionada a patients.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️  Coluna 'username' já existe em patients.");
            } else {
                throw e;
            }
        }

        // 2. Atualizar Tabela Athletes (Adicionar patient_id)
        console.log("📦 Verificando tabela athletes...");
        try {
            await client.query("ALTER TABLE athletes ADD COLUMN patient_id INTEGER REFERENCES patients(id)");
            console.log("✅ Coluna 'patient_id' adicionada a athletes.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️  Coluna 'patient_id' já existe em athletes.");
            } else {
                throw e;
            }
        }

        // 3. Cadastrar/Atualizar Casas
        console.log("🏰 Verificando Casas da Marcha Cup...");
        for (const h of housesList) {
            const res = await client.query("SELECT id FROM houses WHERE name = $1", [h.name]);
            if (res.rowCount === 0) {
                await client.query("INSERT INTO houses (name, color, active) VALUES ($1, $2, 1)", [h.name, h.color]);
                console.log(`✅ Casa criada: ${h.name}`);
            } else {
                console.log(`ℹ️  Casa já existe: ${h.name}`);
            }
        }

        await client.query('COMMIT');
        console.log("🎉 Atualização concluída com sucesso!");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Erro na atualização:", err);
    } finally {
        client.release();
        pool.end();
    }
}

updateDB();
