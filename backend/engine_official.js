
// ==========================================
// 🔥 MARCHA CUP 2026 OFFICIAL ENGINE 🔥
// ==========================================

// 1. Gerador de Hash de Segurança
const generateHash = (data) => {
    return crypto.createHash('sha256').update(data + Date.now()).digest('hex').substring(0, 12);
};

// 2. Cálculo de Meta da Casa
const calculateHouseMeta = async (houseId) => {
    const result = await pool.query("SELECT COUNT(*) as count FROM patients WHERE house_id = $1 AND role = 'atleta'", [houseId]);
    const athleteCount = result.rows[0].count;
    return (athleteCount * 20) + 10;
};

// 3. Lançamento Oficial de Meinhas (Engine Principal)
app.post('/api/scores', async (req, res) => {
    const { athlete_id, rule_id, launcher_id } = req.body;

    try {
        // Busca info da regra
        const ruleRes = await pool.query("SELECT * FROM scoring_rules WHERE id = $1", [rule_id]);
        if (ruleRes.rowCount === 0) return res.status(404).json({ error: "Regra não encontrada" });
        const rule = ruleRes.rows[0];

        const hash = generateHash(`${athlete_id}-${rule_id}`);

        // Insere o score
        await pool.query(
            "INSERT INTO scores (athlete_id, rule_id, launcher_id, hash_id) VALUES ($1, $2, $3, $4)",
            [athlete_id, rule_id, launcher_id, hash]
        );

        // Atualiza totais do atleta
        await pool.query(
            "UPDATE patients SET meinhas_month = meinhas_month + $1, meinhas_history = meinhas_history + $1 WHERE id = $2",
            [rule.value, athlete_id]
        );

        // --- AUTOMAÇÃO: CONQUISTA DE CARTAS ---
        if (rule.name === 'Presença') {
            const updateRes = await pool.query(
                "UPDATE patients SET consecutive_presences = consecutive_presences + 1 WHERE id = $1 RETURNING consecutive_presences, house_id",
                [athlete_id]
            );

            const { consecutive_presences, house_id } = updateRes.rows[0];

            // A cada 3 presenças seguidas -> 1 Carta Comum
            if (consecutive_presences > 0 && consecutive_presences % 3 === 0) {
                const cardRes = await pool.query("SELECT id FROM cards WHERE rarity = 'Comum' ORDER BY RANDOM() LIMIT 1");
                if (cardRes.rowCount > 0) {
                    const cardId = cardRes.rows[0].id;
                    const cardHash = generateHash(`card-${athlete_id}-${cardId}`);
                    await pool.query(
                        "INSERT INTO user_cards (card_id, user_id, house_id, hash_code) VALUES ($1, $2, $3, $4)",
                        [cardId, athlete_id, house_id, cardHash]
                    );
                    // Log de auditoria
                    await pool.query("INSERT INTO audit_logs (user_id, action, details) VALUES ($1, 'AUTO_CARD', $2)",
                        [athlete_id, `Ganhou carta comum por 3 presenças seguidas`]);
                }
            }
        }

        res.json({ success: true, hash });
    } catch (err) {
        console.error("SCORE ERROR:", err);
        res.status(500).json({ error: "Erro ao registrar pontos" });
    }
});

// 4. Baralho Estratégico e Cartas Secretas
app.post('/api/cards/use', async (req, res) => {
    const { user_card_id, target_id, user_id } = req.body;

    try {
        const cardRes = await pool.query(`
      SELECT uc.*, c.name, c.is_secret, c.rarity 
      FROM user_cards uc 
      JOIN cards c ON uc.card_id = c.id 
      WHERE uc.id = $1 AND uc.status = 'available'
    `, [user_card_id]);

        if (cardRes.rowCount === 0) return res.status(404).json({ error: "Carta não disponível ou já usada" });
        const card = cardRes.rows[0];

        // Marcar como usada
        await pool.query(
            "UPDATE user_cards SET status = 'used', used_at = CURRENT_TIMESTAMP, target_id = $1 WHERE id = $2",
            [target_id, user_card_id]
        );

        // Lógica de Auditoria e Visibilidade
        const logDetails = `Carta ${card.name} usada por ${card.user_id} em ${target_id}. Secreta: ${card.is_secret}`;
        await pool.query("INSERT INTO audit_logs (user_id, action, details) VALUES ($1, 'USE_CARD', $2)", [user_id, logDetails]);

        res.json({
            success: true,
            message: `Carta ${card.name} ativada!`,
            is_secret: card.is_secret
        });
    } catch (err) {
        console.error("CARD USE ERROR:", err);
        res.status(500).json({ error: "Erro ao usar carta" });
    }
});

// 5. Placar Público (Sem informações secretas)
app.get('/api/public/placar', async (req, res) => {
    try {
        const ranking = await pool.query(`
      SELECT h.name, h.color, h.meta_mensal, 
             SUM(p.meinhas_month) as total_meinhas
      FROM houses h
      LEFT JOIN patients p ON p.house_id = h.id
      WHERE h.active = 1
      GROUP BY h.id
      ORDER BY total_meinhas DESC
    `);

        // Masking meta if needed, or just showing public totals
        res.json(ranking.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao carregar placar" });
    }
});

// 6. Registro de Pomo (Seção 5)
app.post('/api/pomo/record', async (req, res) => {
    const { category, athlete_id, value, house_id } = req.body;

    try {
        const current = await pool.query("SELECT current_record_value FROM pomo_records WHERE category_name = $1", [category]);

        if (current.rowCount > 0 && value > current.rows[0].current_record_value) {
            await pool.query(
                "UPDATE pomo_records SET current_record_value = $1, athlete_id = $2, house_id = $3, updated_at = CURRENT_TIMESTAMP WHERE category_name = $4",
                [value, athlete_id, house_id, category]
            );
            res.json({ success: true, newRecord: true });
        } else {
            res.json({ success: true, newRecord: false });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro ao registrar pomo" });
    }
});

// 7. Reset Mensal Automático (Simulação Trigger Dia 1)
app.get('/api/admin/check-reset', async (req, res) => {
    const now = new Date();
    if (now.getDate() === 1) {
        // Lógica de reset (Mover para monthly_history e zerar meinhas_month)
        // ... implementar se necessário ...
        res.json({ message: "Dia 1: Sistema pronto para reset mensal." });
    } else {
        res.json({ message: `Hoje é dia ${now.getDate()}. Reset apenas dia 1.` });
    }
});
