-- ===============================================
-- LIMPEZA TOTAL E REGULAMENTO OFICIAL 2026
-- Remove todas as regras obsoletas e instala APENAS as Meinhas
-- ===============================================

PRAGMA foreign_keys = ON;

-- ========== 1. LIMPAR TODAS AS REGRAS OBSOLETAS ==========
DELETE FROM scoring_rules WHERE name NOT IN (
  'Presença',
  'Cor da Casa',
  'Story',
  'Reels',
  'Falta',
  'Evolução Técnica',
  'Capitão (Mensal)',
  'Presença em Aula',
  'Usar a Cor da Casa',
  'Story (@marchapilates)',
  'Reels ou Feed',
  'Desafio de Sala',
  'Indicação (Experimental)',
  'Conversão (Virou Aluno)',
  'Falta sem justificativa'
);

-- Garantir que regras antigas de +50, +30, +20, +15, +10, +5 sejam apagadas
DELETE FROM scoring_rules WHERE value > 5 OR value < -2;
DELETE FROM scoring_rules WHERE name LIKE '%Pomo de Ouro%';
DELETE FROM scoring_rules WHERE name LIKE '%Presente%';
DELETE FROM scoring_rules WHERE name LIKE '%Ser legal%';
DELETE FROM scoring_rules WHERE name LIKE '%Boas ações%';
DELETE FROM scoring_rules WHERE name LIKE '%Casa mais animada%';
DELETE FROM scoring_rules WHERE name LIKE '%Indicação que fecha%';
DELETE FROM scoring_rules WHERE name LIKE '%Subir de nível%';
DELETE FROM scoring_rules WHERE name LIKE '%Destaque%';
DELETE FROM scoring_rules WHERE name LIKE '%Prancha%';
DELETE FROM scoring_rules WHERE name LIKE '%Recorde de abdominal%';
DELETE FROM scoring_rules WHERE name LIKE '%Duelo%';
DELETE FROM scoring_rules WHERE name LIKE '%Missão%';
DELETE FROM scoring_rules WHERE name LIKE '%Chair%';
DELETE FROM scoring_rules WHERE name LIKE '%Arte da Casa%';
DELETE FROM scoring_rules WHERE name LIKE '%Escudo%';
DELETE FROM scoring_rules WHERE name LIKE '%Cartões%';
DELETE FROM scoring_rules WHERE name LIKE '%Desafio não executado%';
DELETE FROM scoring_rules WHERE name LIKE '%Falta sem aviso%';

-- ========== 2. INSTALAR REGULAMENTO OFICIAL 2026 ==========

-- Limpar completamente a tabela
DELETE FROM scoring_rules;

-- Resetar o autoincrement
DELETE FROM sqlite_sequence WHERE name = 'scoring_rules';

-- INSERIR EXCLUSIVAMENTE AS REGRAS DO REGULAMENTO 2026
INSERT INTO scoring_rules (name, value, category, points_type, active) VALUES
  -- AÇÕES DIÁRIAS (Meinhas)
  ('Presença em Aula', 1, 'Meinha', 'presence', 1),
  ('Usar a Cor da Casa', 1, 'Meinha', 'house_color', 1),
  ('Story (@marchapilates)', 1, 'Meinha', 'story', 1),
  ('Reels ou Feed', 2, 'Meinha', 'reels', 1),
  ('Desafio de Sala (Aleatório)', 2, 'Meinha', 'challenge', 1),
  ('Evolução Técnica', 3, 'Meinha', 'evolution', 1),
  ('Indicação (Experimental)', 3, 'Meinha', 'referral', 1),
  ('Conversão (Virou Aluno)', 2, 'Meinha', 'conversion', 1),
  ('Falta sem justificativa', -2, 'Punição', 'absence', 1),
  
  -- SISTEMA DO POMO (Recordes)
  ('Pomo - Meta Base', 3, 'Pomo', 'pomo_meta', 1),
  ('Pomo - Recorde', 5, 'Pomo', 'pomo_record', 1),
  
  -- BÔNUS DE CAPITÃES
  ('Capitão (Bônus Fixo Mensal)', 5, 'Capitão', 'captain', 1);

-- ========== 3. SISTEMA DE HASH ÚNICO PARA CARTAS ==========

-- Adicionar campo hash_code na tabela active_cards
ALTER TABLE active_cards ADD COLUMN hash_code TEXT UNIQUE;

-- Criar índice para verificação rápida de hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards_hash ON active_cards(hash_code);

-- ========== 4. VERIFICAÇÃO FINAL ==========

-- Contar regras ativas (deve ser exatamente 12)
SELECT COUNT(*) as total_regras FROM scoring_rules WHERE active = 1;

-- Listar todas as regras para confirmação
SELECT id, name, value, category FROM scoring_rules ORDER BY value DESC;
