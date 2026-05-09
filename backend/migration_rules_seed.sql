DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('Comparecer', 2),
        ('Ser legal', 3),
        ('Postar Story', 3),
        ('Boas ações', 5),
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
