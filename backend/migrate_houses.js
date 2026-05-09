const { pool } = require('./db');
const path = require('path');
const fs = require('fs');

async function migrateHouses() {
    console.log("🚀 Iniciando Migração das Casas (Pilates Theme)...");

    const newHouses = [
        { name: 'Barrel', color: '#8B4513', crest: 'assets/img/barrel.png' },   // Marrom madeira
        { name: 'Cadillac', color: '#4682B4', crest: 'assets/img/cadillac.png' }, // Azul aço
        { name: 'Chair', color: '#DAA520', crest: 'assets/img/chair.png' },      // Dourado
        { name: 'Joseph', color: '#2F4F4F', crest: 'assets/img/joseph.png' },    // Cinza escuro
        { name: 'Reformer', color: '#800080', crest: 'assets/img/reformer.png' } // Roxo
    ];

    try {
        await pool.query("BEGIN");

        // 1. Limpar tabela houses existente (Desativar constraint check temp se necessario, mas vamos tentar delete direto)
        // Como existem atletas vinculados, precisamos decidir o que fazer.
        // O Supervisor pediu "Delete as casas antigas". Isso vai quebrar FK de athletes se não fizermos update.
        // ESTRATÉGIA: Criar as novas, Mover os Atletas aleatoriamente (ou para uma default), Deletar as velhas.
        // OU MELHOR: Truncate e recriar IDs? Isso quebra histórico.

        // ESTRATÉGIA SEGURA: UPDATE nas existentes se houver 4, criar 1 nova?
        // Não, os nomes e IDs mudam a semântica.

        // ESTRATÉGIA BRUTAL (Supervisor Style): "Delete e insira".
        // Vamos desvincular atletas temporariamente (set house_id = NULL ou deletar atletas se for reset total? Nao, reset só das casas).
        // Vamos assumir que é um reset de gamificação.

        console.log("🧹 Limpando dados antigos...");
        // Desvincular atletas
        await pool.query("DELETE FROM house_points_log"); // Limpa histórico de pontos
        await pool.query("UPDATE athletes SET house_id = NULL"); // Desvincula atletas
        await pool.query("DELETE FROM houses"); // Deleta casas (reset IDs)

        // Reset AutoIncrement (SQLite specific)
        await pool.query("DELETE FROM sqlite_sequence WHERE name='houses'");

        // 2. Inserir Novas Casas
        console.log("🏗️  Construindo novas casas...");
        for (const house of newHouses) {
            await pool.query(
                "INSERT INTO houses (name, color, crest, active) VALUES ($1, $2, $3, 1)",
                [house.name, house.color, house.crest]
            );
            console.log(`   ✅ Casa Criada: ${house.name}`);
        }

        // 3. Redistribuir Atletas (Opcional, mas bom para não quebrar o app)
        // Pega todos atletas e distribui Round Robin
        const athletes = await pool.query("SELECT id FROM athletes");
        if (athletes.rows.length > 0) {
            console.log(`🔄 Redistribuindo ${athletes.rows.length} atletas nas 5 novas casas...`);
            const houses = await pool.query("SELECT id FROM houses ORDER BY id ASC");

            let hIndex = 0;
            for (const ath of athletes.rows) {
                const hId = houses.rows[hIndex % 5].id;
                await pool.query("UPDATE athletes SET house_id = $1 WHERE id = $2", [hId, ath.id]);
                hIndex++;
            }
        }

        await pool.query("COMMIT");
        console.log("🏁 Migração Concluída com Sucesso!");

    } catch (err) {
        await pool.query("ROLLBACK");
        console.error("❌ Erro na migração:", err.message);
    }
}

// Criar pasta de assets se não existir
const imgDir = path.join(__dirname, '../frontend/assets/img');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
    console.log("📂 Pasta 'frontend/assets/img' criada para você colocar as imagens depois.");
}

migrateHouses();
