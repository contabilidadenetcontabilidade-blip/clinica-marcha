-- Definitive Complete Rules Seed (Syncing with User Request)
-- This file will be executed by db.js.
-- It ensures all listed rules exist in the `scoring_rules` table.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        -- POSITIVAS
        ('Comparecer à aula', 2, 'Positiva'),
        ('Ser legal com o colega', 3, 'Positiva'),
        ('Ser legal com o professor', 3, 'Positiva'),
        ('Postar Story', 3, 'Positiva'),
        ('Boas ações no estúdio', 5, 'Positiva'),
        ('Dar ideias para o estúdio', 5, 'Positiva'),
        ('Trazer presente para o Mascote 🐱', 5, 'Positiva'),
        ('Compartilhar conteúdos da Marcha', 5, 'Positiva'),
        ('Vencer o desafio da aula', 5, 'Positiva'),
        ('Vir com o visual da sua Casa', 5, 'Positiva'),
        ('Postar no Feed em Collab', 10, 'Positiva'),
        ('Evolução geral (física/técnica)', 10, 'Positiva'),
        ('Participar de Eventos/Passeios', 15, 'Positiva'),
        ('Indicar amigo para aula experimental', 15, 'Positiva'),
        ('Destaque da aula (O melhor do dia)', 15, 'Positiva'),
        ('Casa mais animada da semana', 20, 'Positiva'),
        ('Indicação que fecha plano', 30, 'Positiva'),
        ('Subir de nível (Avaliação)', 50, 'Positiva'),
        
        -- NEGATIVAS
        ('Falta sem aviso prévio', -5, 'Negativa'),
        ('Desafio não executado', -5, 'Negativa'),
        ('Acumular 2 cartões amarelos', -10, 'Negativa'),
        
        -- ESPECIAIS / ITENS
        ('Prancha (tempo recorde)', 10, 'Mágica'),
        ('Recorde de abdominal', 10, 'Mágica'),
        ('Vencer Duelo de Casas', 20, 'Mágica'),
        ('Missão Fotográfica', 15, 'Mágica'),
        ('Chair Explosiva', 10, 'Mágica'),
        ('Fazer Story em dupla (Casas diferentes)', 5, 'Mágica'),
        ('Arte da Casa (Desenho/Cartaz)', 15, 'Mágica'),
        ('Pomo de Ouro', 50, 'Mágica'),
        ('Escudo (Proteção)', 0, 'Item')

    ) AS t(name, value, category)
    LOOP
        -- Check if rule exists by name, if not insert.
        IF NOT EXISTS (SELECT 1 FROM scoring_rules WHERE name = r.name) THEN
            INSERT INTO scoring_rules (name, value, category, active) VALUES (r.name, r.value, r.category, 1);
        ELSE
            -- Optional: Update description or category if needed, but usually we respect existing.
            -- Let's update category just in case it was 'general' before.
            UPDATE scoring_rules SET category = r.category WHERE name = r.name;
        END IF;
    END LOOP;
END $$;
