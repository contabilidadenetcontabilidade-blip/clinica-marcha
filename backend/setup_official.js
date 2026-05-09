const { pool } = require('./db');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function setupOfficial() {
    console.log("🚀 INICIANDO INTEGRAÇÃO DA ESTRUTURA OFICIAL...");

    try {
        // 1. Limpeza Radical (Conforme solicitado)
        console.log("🧹 Limpando dados antigos...");
        const tablesToDrop = ['scoring_rules', 'houses', 'athletes', 'scores', 'house_points_log', 'patients', 'cards', 'active_cards', 'pomo_records', 'user_cards', 'monthly_history', 'audit_logs'];
        for (let table of tablesToDrop) {
            await pool.query(`DROP TABLE IF EXISTS ${table}`);
        }

        // 2. Ler e Aplicar Schema
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema_official.sql'), 'utf8');
        const statements = schemaSql.split(';').filter(s => s.trim());

        for (let sql of statements) {
            await pool.query(sql);
        }
        console.log("✅ Schema oficial aplicado.");

        // 2. Limpar Regras Antigas e Inserir Engine de Pontuação Oficial
        await pool.query("DELETE FROM scoring_rules");
        const officialRules = [
            { name: 'Presença', value: 1, cat: 'Positiva', role: 'capitao' },
            { name: 'Cor da Casa', value: 1, cat: 'Positiva', role: 'atleta' },
            { name: 'Story', value: 1, cat: 'Positiva', role: 'atleta' },
            { name: 'Reels', value: 2, cat: 'Positiva', role: 'atleta' },
            { name: 'Evolução Técnica', value: 3, cat: 'Especial', role: 'coord' },
            { name: 'Indicação', value: 1, cat: 'Positiva', role: 'atleta' },
            { name: 'Efetivação', value: 5, cat: 'Positiva', role: 'atleta' },
            { name: 'Falta Injustificada', value: -2, cat: 'Negativa', role: 'capitao' },
            { name: 'Eventos', value: 5, cat: 'Positiva', role: 'atleta' },
            { name: 'Campo de Batalha (Recorde)', value: 1, cat: 'Especial', role: 'coord' },
            { name: 'Senhorinha', value: 2, cat: 'Positiva', role: 'atleta' },
            { name: 'Marombinha', value: 2, cat: 'Positiva', role: 'atleta' },
            { name: 'Meta Pomo', value: 3, cat: 'Especial', role: 'coord' },
            { name: 'Posse Pomo', value: 5, cat: 'Especial', role: 'coord' }
        ];

        for (let r of officialRules) {
            await pool.query(
                "INSERT INTO scoring_rules (name, value, category, target_role) VALUES ($1, $2, $3, $4)",
                [r.name, r.value, r.cat, r.role]
            );
        }
        console.log("✅ Engine de Pontuação integrada.");

        // 3. Criar Perfis de Acesso Iniciais (Se não existirem)
        const initialUsers = [
            { name: 'Glaubert Admin', user: 'glaubert', pass: 'marcha2026', role: 'admin' },
            { name: 'Beto Admin', user: 'beto', pass: 'marcha2026', role: 'admin' },
            { name: 'Tamara Coord', user: 'tamara', pass: 'marcha2026', role: 'coord' },
            { name: 'Lola Coord', user: 'lola', pass: 'marcha2026', role: 'coord' }
        ];

        for (let u of initialUsers) {
            const check = await pool.query("SELECT id FROM patients WHERE username = $1", [u.user]);
            if (check.rowCount === 0) {
                await pool.query(
                    "INSERT INTO patients (name, username, password, role) VALUES ($1, $2, $3, $4)",
                    [u.name, u.user, u.pass, u.role]
                );
            }
        }
        console.log("✅ Perfis de acesso Admin/Coord criados.");

        // 4. Inserir Cartas Iniciais (Baralho)
        await pool.query("DELETE FROM cards");
        const cards = [
            { name: 'Coringa', rarity: 'Lendária', effect: 'Efeito Secreto - Altera destino da pontuação', secret: 1 },
            { name: 'Escudo de Athena', rarity: 'Rara', effect: 'Protege contra penalidades por 1 semana', secret: 0 },
            { name: 'Dobro ou Nada', rarity: 'Épica', effect: 'Dobra pontos da próxima tarefa', secret: 0 },
            { name: 'Pomo de Prata', rarity: 'Comum', effect: 'Ganha +5 Meinhas instantâneas', secret: 0 }
        ];

        for (let c of cards) {
            await pool.query(
                "INSERT INTO cards (name, rarity, effect_description, is_secret) VALUES ($1, $2, $3, $4)",
                [c.name, c.rarity, c.effect, c.secret]
            );
        }
        console.log("✅ Baralho estratégico inicial carregado.");

        // 5. Inicializar Pomo Masculino/Feminino
        await pool.query("DELETE FROM pomo_records");
        await pool.query("INSERT INTO pomo_records (category_name) VALUES ('Masculino')");
        await pool.query("INSERT INTO pomo_records (category_name) VALUES ('Feminino')");
        console.log("✅ Registros do Pomo inicializados.");

        console.log("\n🔥 ESTRUTURA INTEGRADA 🔥");
        process.exit(0);

    } catch (err) {
        console.error("❌ ERRO NA CONFIGURAÇÃO:", err);
        process.exit(1);
    }
}

setupOfficial();
