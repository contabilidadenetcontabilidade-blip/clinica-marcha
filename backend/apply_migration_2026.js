const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🚀 Aplicando Migration: Baralho de Poder 2026...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        process.exit(1);
    }
});

async function executeSQL(sql, desc) {
    return new Promise((resolve) => {
        db.run(sql, (err) => {
            if (err) {
                console.log(`⚠️  ${desc}: ${err.message}`);
            } else {
                console.log(`✅ ${desc}`);
            }
            resolve();
        });
    });
}

async function runMigration() {
    // 1. Criar tabela de cartas
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      rarity TEXT NOT NULL CHECK(rarity IN ('Comum', 'Rara', 'Épica', 'Lendária')),
      image_path TEXT NOT NULL,
      effect_type TEXT,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, 'Tabela cards criada');

    // 2. Criar tabela de cartas ativas
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS active_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      house_id INTEGER,
      athlete_id INTEGER,
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (card_id) REFERENCES cards(id),
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (athlete_id) REFERENCES athletes(id)
    )
  `, 'Tabela active_cards criada');

    // 3. Adicionar campo points_type em scoring_rules
    await executeSQL(`ALTER TABLE scoring_rules ADD COLUMN points_type TEXT DEFAULT 'manual'`,
        'Campo points_type adicionado');

    // 4. Criar categorias do Pomo
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS pomo_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT,
      meta_value DECIMAL(10,2),
      description TEXT,
      active INTEGER DEFAULT 1
    )
  `, 'Tabela pomo_categories criada');

    // 5. Criar recordes do Pomo
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS pomo_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      athlete_id INTEGER NOT NULL,
      house_id INTEGER NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      is_record INTEGER DEFAULT 0,
      has_possession INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES pomo_categories(id),
      FOREIGN KEY (athlete_id) REFERENCES athletes(id),
      FOREIGN KEY (house_id) REFERENCES houses(id)
    )
  `, 'Tabela pomo_records criada');

    // 6. Criar efeitos de cartas
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS card_effects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      active_card_id INTEGER NOT NULL,
      target_house_id INTEGER,
      effect_name TEXT NOT NULL,
      effect_value INTEGER,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (active_card_id) REFERENCES active_cards(id),
      FOREIGN KEY (target_house_id) REFERENCES houses(id)
    )
  `, 'Tabela card_effects criada');

    // 7. Adicionar campo is_captain em athletes
    await executeSQL(`ALTER TABLE athletes ADD COLUMN is_captain INTEGER DEFAULT 0`,
        'Campo is_captain adicionado');

    // 8. Criar contador mensal do Pomo
    await executeSQL(`
    CREATE TABLE IF NOT EXISTS pomo_monthly_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      house_id INTEGER NOT NULL,
      pomo_count INTEGER DEFAULT 0,
      awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      UNIQUE(month, year, house_id)
    )
  `, 'Tabela pomo_monthly_winners criada');

    // 9. Seed: Cartas
    console.log('\n🃏 Inserindo seeds de cartas...');
    const cartas = [
        ['Spoiler', 'Comum', '/cartas/spoiler.jpeg', 'spoiler', 'Espreitador de segredos'],
        ['Vida', 'Comum', '/cartas/vida.jpeg', 'vida', 'Anula -2 de uma falta'],
        ['Senhorinha', 'Comum', '/cartas/senhorinha.jpeg', 'senhorinha', 'Graça e sabedoria'],
        ['Marombinha', 'Comum', '/cartas/marombinha.jpeg', 'marombinha', 'Força bruta'],
        ['Ladino', 'Rara', '/cartas/ladino.jpeg', 'ladino', 'Rouba 3 pontos de uma casa rival'],
        ['Zica', 'Rara', '/cartas/zica.jpeg', 'zica', 'Dobra o valor das faltas (-4) por 7 dias'],
        ['Reverso', 'Rara', '/cartas/reverso.jpeg', 'reverso', 'Inverte a situação'],
        ['Influencer', 'Épica', '/cartas/influencer.jpeg', 'influencer', 'Dobra pontos de Story/Reels por 7 dias'],
        ['Coringa', 'Épica', '/cartas/coringa.jpeg', 'coringa', 'Carta selvagem'],
        ['Trapaça', 'Épica', '/cartas/trapaca.jpeg', 'trapaca', 'Truques sujos'],
        ['VAR', 'Lendária', '/cartas/var.jpeg', 'var', 'Revisão técnica'],
        ['Tandera', 'Lendária', '/cartas/tandera.jpeg', 'tandera', 'Poder supremo'],
        ['Invisibilidade', 'Lendária', '/cartas/invisibilidade.jpeg', 'invisibilidade', 'Furtividade total'],
        ['Aliança', 'Lendária', '/cartas/alianca.jpeg', 'alianca', 'União das casas'],
        ['Golpe de Estado', 'Lendária', '/cartas/golpe de estado.jpeg', 'golpe_estado', 'Revolução completa']
    ];

    for (const carta of cartas) {
        await executeSQL(
            `INSERT OR IGNORE INTO cards (name, rarity, image_path, effect_type, description) VALUES (?, ?, ?, ?, ?)`,
            `Carta: ${carta[0]}`
        );
        // Execute com parâmetros
        await new Promise((resolve) => {
            db.run(`INSERT OR IGNORE INTO cards (name, rarity, image_path, effect_type, description) VALUES (?, ?, ?, ?, ?)`,
                carta, (err) => {
                    if (!err) console.log(`  ✅ ${carta[0]}`);
                    resolve();
                });
        });
    }

    // 10. Seed: Categorias do Pomo
    console.log('\n🏅 Inserindo categorias do Pomo...');
    const pomos = [
        ['Velocidade', 'segundos', 10.0, 'Tempo mínimo em corrida de velocidade'],
        ['Força', 'kg', 50.0, 'Peso levantado em exercício de força'],
        ['Resistência', 'minutos', 30.0, 'Tempo de resistência em atividade contínua'],
        ['Técnica', 'pontos', 8.5, 'Avaliação técnica em movimento específico']
    ];

    for (const pomo of pomos) {
        await new Promise((resolve) => {
            db.run(`INSERT OR IGNORE INTO pomo_categories (name, unit, meta_value, description) VALUES (?, ?, ?, ?)`,
                pomo, (err) => {
                    if (!err) console.log(`  ✅ ${pomo[0]}`);
                    resolve();
                });
        });
    }

    // 11. Seed: Novas regras de pontuação
    console.log('\n📋 Inserindo novas regras de pontuação...');
    const regras = [
        ['Presença', 1, 'Positiva', 'presence'],
        ['Cor da Casa', 1, 'Positiva', 'house_color'],
        ['Story', 1, 'Positiva', 'story'],
        ['Reels', 2, 'Positiva', 'reels'],
        ['Falta', -2, 'Negativa', 'absence'],
        ['Evolução Técnica', 3, 'Positiva', 'evolution'],
        ['Capitão (Mensal)', 5, 'Positiva', 'captain']
    ];

    for (const regra of regras) {
        await new Promise((resolve) => {
            db.run(`INSERT OR IGNORE INTO scoring_rules (name, value, category, points_type) VALUES (?, ?, ?, ?)`,
                regra, (err) => {
                    if (!err) console.log(`  ✅ ${regra[0]} (${regra[1]} pts)`);
                    resolve();
                });
        });
    }

    // 12. Criar índices
    console.log('\n🔍 Criando índices...');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_active_cards_house ON active_cards(house_id)`, 'Índice active_cards_house');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_active_cards_athlete ON active_cards(athlete_id)`, 'Índice active_cards_athlete');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_pomo_records_category ON pomo_records(category_id)`, 'Índice pomo_records_category');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_pomo_records_house ON pomo_records(house_id)`, 'Índice pomo_records_house');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_card_effects_target ON card_effects(target_house_id)`, 'Índice card_effects_target');

    db.close(() => {
        console.log('\n🎉 Migration Baralho de Poder 2026 concluída com sucesso!\n');
    });
}

runMigration();
