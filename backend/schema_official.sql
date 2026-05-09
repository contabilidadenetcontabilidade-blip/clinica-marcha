-- ESTRUTURA OFICIAL MARCHA CUP 2026

PRAGMA foreign_keys = ON;

-- 1. CASAS
CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  virtues TEXT,
  crest TEXT,
  meta_mensal INTEGER DEFAULT 0,
  ranking_pontos_mes INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUÁRIOS (PATIENTS)
-- Nota: O sistema usa a tabela 'patients' para usuários.
-- Perfil: Atleta, Capitão, Coordenação, Admin
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'atleta', -- 'atleta', 'capitao', 'coord', 'admin'
  phone TEXT,
  email TEXT,
  photo TEXT,
  house_id INTEGER,
  consecutive_presences INTEGER DEFAULT 0,
  meinhas_month INTEGER DEFAULT 0,
  meinhas_history INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- 3. ENGINE DE PONTUAÇÃO (REGRAS)
CREATE TABLE IF NOT EXISTS scoring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  category TEXT DEFAULT 'Geral', -- 'Positiva', 'Negativa', 'Especial'
  active INTEGER DEFAULT 1,
  target_role TEXT DEFAULT 'atleta' -- Quem pode lançar: 'atleta', 'capitao', 'coord'
);

-- 4. LANÇAMENTOS (MEINHAS)
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athlete_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  launcher_id INTEGER, -- Quem lançou
  is_verified INTEGER DEFAULT 1,
  hash_id TEXT UNIQUE, -- Segurança
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES patients(id),
  FOREIGN KEY (rule_id) REFERENCES scoring_rules(id),
  FOREIGN KEY (launcher_id) REFERENCES patients(id)
);

-- 5. HISTÓRICO DE RESET (MENSAL)
CREATE TABLE IF NOT EXISTS monthly_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  total_meinhas INTEGER NOT NULL,
  house_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES patients(id),
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- 6. BARALHO ESTRATÉGICO
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL, -- 'Comum', 'Rara', 'Épica', 'Lendária'
  effect_description TEXT,
  is_secret INTEGER DEFAULT 0, -- 1 = Apenas emissor e coord veem a origem
  image_url TEXT,
  active INTEGER DEFAULT 1
);

-- CARTAS ATIVAS/DISPONÍVEIS
CREATE TABLE IF NOT EXISTS user_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL, -- Dono da carta (atleta ou capitão)
  house_id INTEGER NOT NULL, -- Casa vinculada
  status TEXT DEFAULT 'available', -- 'available', 'used'
  hash_code TEXT UNIQUE, -- Segurança contra reuso
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  target_id INTEGER, -- Alvo da carta (atleta ou casa)
  secret_applied INTEGER DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (user_id) REFERENCES patients(id),
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- 7. POMO DE OURO E CAMPO DE BATALHA
CREATE TABLE IF NOT EXISTS pomo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL, -- 'Masculino', 'Feminino'
  current_record_value REAL DEFAULT 0,
  athlete_id INTEGER,
  house_id INTEGER,
  is_posse_volante INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES patients(id),
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- 8. LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES patients(id)
);
