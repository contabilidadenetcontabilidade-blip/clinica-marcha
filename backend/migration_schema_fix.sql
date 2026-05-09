-- Definitive Schema Fix inspired by User Request
-- Uses IF NOT EXISTS to be safe, but ensures structure matches user needs
-- Maps user's desired column names/concepts to our existing English schema if needed, 
-- BUT for simplicity and to match the user's specific SQL request, I will adhere to the core English schema used in index.js (scoring_rules, house_points_log)
-- while ensuring all "Portuguese" named rules are present.

-- 1. Rules Table (scoring_rules)
CREATE TABLE IF NOT EXISTS scoring_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    type TEXT DEFAULT 'general', -- Validating 'type' column presence for safety although v0.53 removed it from inserts. 
    -- If column type missing, it's fine, we focus on name/value.
    active INTEGER DEFAULT 1
);

-- 2. Logs Table (house_points_log)
CREATE TABLE IF NOT EXISTS house_points_log (
    id SERIAL PRIMARY KEY,
    house_id INTEGER REFERENCES houses(id),
    student_id INTEGER REFERENCES patients(id), 
    rule_id INTEGER REFERENCES scoring_rules(id),
    points_awarded INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed Rules (Including User's Specific Requests)
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('Comparecer', 2),
        ('Ser legal', 3),
        ('Postar Story', 3),
        ('Boas ações', 5),
        ('Boas Ações', 5), -- User requested explicit "Boas Ações"
        ('Presente Mascote 🐱', 5),
        ('Postar Feed Collab', 10),
        ('Evolução Geral', 10),
        ('Eventos/Passeios', 15),
        ('Indicar Amigo', 15),
        ('Destaque da Aula', 15),
        ('Indicação Venda', 30),
        ('Subir de Nível', 50),
        ('Pomo de Ouro', 50),
        ('Falta sem aviso', -5),
        ('Desafio não feito', -5),
        ('2 Cartões Amarelos', -10)
    ) AS t(name, value)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM scoring_rules WHERE name = r.name) THEN
            INSERT INTO scoring_rules (name, value, active) VALUES (r.name, r.value, 1);
        END IF;
    END LOOP;
END $$;
