-- Migration V12: Gamification (Marcha Cup)

-- 1. Rules Table
CREATE TABLE IF NOT EXISTS scoring_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value INTEGER NOT NULL,
    type TEXT DEFAULT 'general',
    active INTEGER DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_rules_name ON scoring_rules(name);

-- 2. Seed Rules
INSERT INTO scoring_rules (name, value, type) VALUES 
('Postar no Feed 📸', 10, 'positive'),
('Postar Stories 🤳', 5, 'positive'),
('Vir de Uniforme 👕', 5, 'positive'),
('Chegar no Horário ⏰', 2, 'positive'),
('Trazer Convidado 🤝', 20, 'positive'),
('Atraso > 10min 🐢', -5, 'negative'),
('Uso de Celular na Aula 📵', -5, 'negative'),
('Sem Uniforme 👚', -2, 'negative'),
('1º Lugar Desafio 🥇', 50, 'special'),
('2º Lugar Desafio 🥈', 30, 'special'),
('3º Lugar Desafio 🥉', 15, 'special'),
('Regra Mágica 🧙', 20, 'magic')
ON CONFLICT (name) DO NOTHING;

-- 3. Points Log
CREATE TABLE IF NOT EXISTS house_points_log (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id),
    student_id INTEGER,
    rule_id INTEGER REFERENCES scoring_rules(id),
    points_awarded INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. House Score Column and Init
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='houses' AND column_name='score') THEN
        ALTER TABLE houses ADD COLUMN score INTEGER DEFAULT 100;
    END IF;
END $$;

UPDATE houses SET score = 100 WHERE score IS NULL OR score = 0;
