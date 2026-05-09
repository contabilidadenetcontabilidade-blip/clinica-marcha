-- ⚠️ SCRIPT DE LIMPEZA SEGURA (Adaptado para o schema real)
-- Não deleta estrutura, só dados

-- 1. Limpar pontuação (scores)
DELETE FROM scores;

-- 2. Limpar fila de cartas (card_queue)
DELETE FROM card_queue;

-- 3. Resetar alunos para status inicial (tabela patients)
UPDATE patients SET 
  house_id = NULL,
  role = 'atleta',
  active = 1
WHERE role NOT IN ('admin', 'coord', 'master');

-- 4. Limpar vínculos de casa (tabela athletes mapeia paciente para casa)
DELETE FROM athletes;

-- 5. Limpar logs de pontos por casa
DELETE FROM house_points_log;

-- 6. Verificar integridade (SELECT)
SELECT 'Scores restantes:' as check_msg, COUNT(*) FROM scores;
SELECT 'Athletes com house:' as check_msg, COUNT(*) FROM athletes WHERE house_id IS NOT NULL;
SELECT 'Cards na fila:' as check_msg, COUNT(*) FROM card_queue;
