INSERT INTO scoring_rules (name, value, description) VALUES 
('Comparecer', 2, 'Presença confirmada na aula'),
('Story', 3, 'Postar story marcando @marcha'),
('Vencer Desafio', 5, 'Vencer o desafio da semana'),
('Uniforme', 1, 'Comparecer uniformizado')
ON CONFLICT (name) DO NOTHING;
