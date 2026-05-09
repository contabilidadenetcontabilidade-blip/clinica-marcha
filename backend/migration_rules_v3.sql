-- Limpar regras antigas para garantir pureza da lista nova (OPCIONAL, mas recomendado se a lista anterior estava incorreta)
-- DELETE FROM scoring_rules; 

INSERT INTO scoring_rules (name, value, description, category) VALUES 
('Comparecer', 2, 'Presença confirmada na aula', 'Positiva'),
('Ser legal colega', 3, 'Atitude positiva com colega', 'Positiva'),
('Ser legal prof', 3, 'Atitude positiva com professor', 'Positiva'),
('Postar story', 3, 'Postar story marcando @marcha', 'Positiva'),
('Boas ações', 5, 'Gestos de gentileza no estúdio', 'Positiva'),
('Ideias estúdio', 5, 'Sugestão implementada', 'Positiva'),
('Presente mascote 🐱', 5, 'Mimo para o mascote', 'Positiva'),
('Compartilhar conteúdos', 5, 'Repostar posts da Marcha', 'Positiva'),
('Desafio aula', 5, 'Cumprir desafio técnico', 'Positiva'),
('Visual da casa', 5, 'Vir com cores/adereços da casa', 'Positiva'),
('Postar feed collab', 10, 'Post no feed em colaboração', 'Positiva'),
('Evolução geral', 10, 'Melhora notável no desempenho', 'Positiva'),
('Eventos/Passeios', 15, 'Participação em eventou externo', 'Positiva'),
('Indicar experimental', 15, 'Amigo veio fazer aula', 'Positiva'),
('Destaque da aula', 15, 'Aluno destaque do dia', 'Positiva'),
('Casa mais animada', 20, 'Casa com maior energia na aula', 'Positiva'),
('Indicação fecha plano', 30, 'Amigo indicado matriculou-se', 'Positiva'),
('Subir de nível', 50, 'Graduação de nível técnico', 'Positiva'),

('Falta sem aviso', -5, 'Faltou sem notificar', 'Negativa'),
('Desafio não executado', -5, 'Não cumpriu o desafio proposto', 'Negativa'),
('2 cartões amarelos', -10, 'Acúmulo de infrações leves', 'Negativa'),

('Prancha', 10, 'Prova de resistência', 'Especial'),
('Recorde abdominal', 10, 'Maior número de reps', 'Especial'),
('Duelo de casas', 20, 'Vencer disputa direta', 'Especial'),
('Missão fotográfica', 15, 'Cumprir tema da foto', 'Especial'),
('Chair explosiva', 10, 'Desafio de força na Chair', 'Especial'),
('Story dupla', 5, 'Story feito em dupla', 'Especial'),
('Arte da casa', 15, 'Criar algo artístico da casa', 'Especial'),

('🛡️ Escudo (Proteção)', 0, 'Proteção contra perda de pontos', 'Mágica'),
('🏅 Pomo de Ouro', 50, 'Captura do Pomo de Ouro', 'Mágica')
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, category = EXCLUDED.category;
