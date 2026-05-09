-- ===============================================
-- MIGRATION: BARALHO DE PODER 2026
-- Sistema completo de cartas, Pomos e nova tabela de pontos
-- ===============================================

PRAGMA foreign_keys = ON;

-- ========== 1. TABELA DE CARTAS ==========
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  rarity TEXT NOT NULL CHECK(rarity IN ('Comum', 'Rara', 'Épica', 'Lendária')),
  image_path TEXT NOT NULL,
  effect_type TEXT, -- 'vida', 'ladino', 'zica', 'influencer', etc.
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== 2. CARTAS ATIVAS (atribuídas a atletas ou casas) ==========
CREATE TABLE IF NOT EXISTS active_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  house_id INTEGER, -- Épicas/Lendárias
  athlete_id INTEGER, -- Comuns/Raras
  activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- Para cartas com duração limitada (ex: 7 dias)
  active INTEGER DEFAULT 1,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (house_id) REFERENCES houses(id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(id)
);

-- ========== 3. NOVA TABELA DE PONTOS (Meinhas) ==========
-- Adicionando campos específicos para o novo sistema
ALTER TABLE scoring_rules ADD COLUMN points_type TEXT DEFAULT 'manual';
-- 'manual', 'presence', 'house_color', 'story', 'reels', 'absence', 'evolution', 'captain'

-- ========== 4. SISTEMA DO POMO (Recordes) ==========
CREATE TABLE IF NOT EXISTS pomo_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- Ex: 'Velocidade', 'Força', 'Resistência', 'Técnica'
  unit TEXT, -- 'segundos', 'kg', 'repetições', etc.
  meta_value DECIMAL(10,2), -- Valor mínimo para ganhar +3 pontos
  description TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pomo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  house_id INTEGER NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  is_record INTEGER DEFAULT 0, -- 1 se for o recorde atual
  has_possession INTEGER DEFAULT 0, -- 1 se a casa tem a posse do Pomo
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES pomo_categories(id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(id),
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- ========== 5. EFEITOS ATIVOS DE CARTAS ==========
-- Tabela para rastrear efeitos temporários (Zica, Influencer, etc.)
CREATE TABLE IF NOT EXISTS card_effects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_card_id INTEGER NOT NULL,
  target_house_id INTEGER, -- Casa afetada (para Zica, Ladino)
  effect_name TEXT NOT NULL, -- 'double_absence', 'double_story_reels', 'steal_points'
  effect_value INTEGER, -- Ex: pontos roubados, multiplicador
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (active_card_id) REFERENCES active_cards(id),
  FOREIGN KEY (target_house_id) REFERENCES houses(id)
);

-- ========== 6. STATUS DE CAPITÃES ==========
ALTER TABLE athletes ADD COLUMN is_captain INTEGER DEFAULT 0;

-- ========== 7. CONTADOR DO 10º PONTO ==========
CREATE TABLE IF NOT EXISTS pomo_monthly_winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  house_id INTEGER NOT NULL,
  pomo_count INTEGER DEFAULT 0,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (house_id) REFERENCES houses(id),
  UNIQUE(month, year, house_id)
);

-- ========== 8. SEED: CARTAS INICIAIS ==========
INSERT OR IGNORE INTO cards (name, rarity, image_path, effect_type, description) VALUES
  ('Spoiler', 'Comum', '/cartas/spoiler.jpeg', 'spoiler', 'Espreitador de segredos'),
  ('Vida', 'Comum', '/cartas/vida.jpeg', 'vida', 'Anula -2 de uma falta'),
  ('Senhorinha', 'Comum', '/cartas/senhorinha.jpeg', 'senhorinha', 'Graça e sabedoria'),
  ('Marombinha', 'Comum', '/cartas/marombinha.jpeg', 'marombinha', 'Força bruta'),
  ('Ladino', 'Rara', '/cartas/ladino.jpeg', 'ladino', 'Rouba 3 pontos de uma casa rival'),
  ('Zica', 'Rara', '/cartas/zica.jpeg', 'zica', 'Dobra o valor das faltas (-4) por 7 dias'),
  ('Reverso', 'Rara', '/cartas/reverso.jpeg', 'reverso', 'Inverte a situação'),
  ('Influencer', 'Épica', '/cartas/influencer.jpeg', 'influencer', 'Dobra pontos de Story/Reels por 7 dias'),
  ('Coringa', 'Épica', '/cartas/coringa.jpeg', 'coringa', 'Carta selvagem'),
  ('Trapaça', 'Épica', '/cartas/trapaca.jpeg', 'trapaca', 'Truques sujos'),
  ('VAR', 'Lendária', '/cartas/var.jpeg', 'var', 'Revisão técnica'),
  ('Tandera', 'Lendária', '/cartas/tandera.jpeg', 'tandera', 'Poder supremo'),
  ('Invisibilidade', 'Lendária', '/cartas/invisibilidade.jpeg', 'invisibilidade', 'Furtividade total'),
  ('Aliança', 'Lendária', '/cartas/alianca.jpeg', 'alianca', 'União das casas'),
  ('Golpe de Estado', 'Lendária', '/cartas/golpe de estado.jpeg', 'golpe_estado', 'Revolução completa');

-- Atualizar caminhos de imagem para usar a rota correta
UPDATE cards SET image_path = '/api/cartas/spoiler.jpeg' WHERE name = 'Spoiler';
UPDATE cards SET image_path = '/api/cartas/vida.jpeg' WHERE name = 'Vida';
UPDATE cards SET image_path = '/api/cartas/senhorinha.jpeg' WHERE name = 'Senhorinha';
UPDATE cards SET image_path = '/api/cartas/marombinha.jpeg' WHERE name = 'Marombinha';
UPDATE cards SET image_path = '/api/cartas/ladino.jpeg' WHERE name = 'Ladino';
UPDATE cards SET image_path = '/api/cartas/zica.jpeg' WHERE name = 'Zica';
UPDATE cards SET image_path = '/api/cartas/reverso.jpeg' WHERE name = 'Reverso';
UPDATE cards SET image_path = '/api/cartas/influencer.jpeg' WHERE name = 'Influencer';
UPDATE cards SET image_path = '/api/cartas/coringa.jpeg' WHERE name = 'Coringa';
UPDATE cards SET image_path = '/api/cartas/trapaca.jpeg' WHERE name = 'Trapaça';
UPDATE cards SET image_path = '/api/cartas/var.jpeg' WHERE name = 'VAR';
UPDATE cards SET image_path = '/api/cartas/tandera.jpeg' WHERE name = 'Tandera';
UPDATE cards SET image_path = '/api/cartas/invisibilidade.jpeg' WHERE name = 'Invisibilidade';
UPDATE cards SET image_path = '/api/cartas/alianca.jpeg' WHERE name = 'Aliança';
UPDATE cards SET image_path = '/api/cartas/golpe de estado.jpeg' WHERE name = 'Golpe de Estado';

-- ========== 9. SEED: CATEGORIAS DO POMO ==========
INSERT OR IGNORE INTO pomo_categories (name, unit, meta_value, description) VALUES
  ('Velocidade', 'segundos', 10.0, 'Tempo mínimo em corrida de velocidade'),
  ('Força', 'kg', 50.0, 'Peso levantado em exercício de força'),
  ('Resistência', 'minutos', 30.0, 'Tempo de resistência em atividade contínua'),
  ('Técnica', 'pontos', 8.5, 'Avaliação técnica em movimento específico');

-- ========== 10. NOVAS REGRAS DE PONTUAÇÃO ==========
INSERT OR IGNORE INTO scoring_rules (name, value, category, points_type) VALUES
  ('Presença', 1, 'Positiva', 'presence'),
  ('Cor da Casa', 1, 'Positiva', 'house_color'),
  ('Story', 1, 'Positiva', 'story'),
  ('Reels', 2, 'Positiva', 'reels'),
  ('Falta', -2, 'Negativa', 'absence'),
  ('Evolução Técnica', 3, 'Positiva', 'evolution'),
  ('Capitão (Mensal)', 5, 'Positiva', 'captain');

-- ========== ÍNDICES PARA PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS idx_active_cards_house ON active_cards(house_id);
CREATE INDEX IF NOT EXISTS idx_active_cards_athlete ON active_cards(athlete_id);
CREATE INDEX IF NOT EXISTS idx_pomo_records_category ON pomo_records(category_id);
CREATE INDEX IF NOT EXISTS idx_pomo_records_house ON pomo_records(house_id);
CREATE INDEX IF NOT EXISTS idx_card_effects_target ON card_effects(target_house_id);
