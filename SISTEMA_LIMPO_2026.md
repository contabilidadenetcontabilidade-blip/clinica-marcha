# ✅ SISTEMA LIMPO - REGULAMENTO OFICIAL 2026

## 🧹 LIMPEZA CONCLUÍDA COM SUCESSO

**Data**: 2026-02-14  
**Status**: ✅ SISTEMA COMPLETAMENTE LIMPO

---

## 📊 TABELA DE MEINHAS (EXCLUSIVA)

O banco de dados agora contém **APENAS** as 12 regras do Regulamento Oficial 2026:

### 1️⃣ AÇÕES DIÁRIAS (Meinhas)

| ID | Regra | Pontos | Categoria |
|----|-------|--------|-----------|
| 1 | **Presença em Aula** | +1 | Meinha |
| 2 | **Usar a Cor da Casa** | +1 | Meinha |
| 3 | **Story (@marchapilates)** | +1 | Meinha |
| 4 | **Reels ou Feed** | +2 | Meinha |
| 5 | **Desafio de Sala (Aleatório)** | +2 | Meinha |
| 6 | **Evolução Técnica** | +3 | Meinha |
| 7 | **Indicação (Experimental)** | +3 | Meinha |
| 8 | **Conversão (Virou Aluno)** | +2 | Meinha |

### 2️⃣ PUNIÇÃO

| ID | Regra | Pontos | Categoria |
|----|-------|--------|-----------|
| 9 | **Falta sem justificativa** | **-2** | Punição |

### 3️⃣ SISTEMA DO POMO (Recordes)

| ID | Regra | Pontos | Categoria |
|----|-------|--------|-----------|
| 10 | **Pomo - Meta Base** | +3 | Pomo |
| 11 | **Pomo - Recorde** | +5 | Pomo |

### 4️⃣ BÔNUS DE CAPITÃES

| ID | Regra | Pontos | Categoria |
|----|-------|--------|-----------|
| 12 | **Capitão (Bônus Fixo Mensal)** | +5 | Capitão |

---

## 🗑️ REGRAS APAGADAS (37 → 12)

**REMOVIDO COMPLETAMENTE:**

❌ Comparecer à aula (+2)  
❌ Ser legal com o colega (+3)  
❌ Ser legal com o professor (+3)  
❌ Postar Story (+3) [versão antiga]  
❌ Boas ações no estúdio (+5)  
❌ Dar ideias para o estúdio (+5)  
❌ Trazer presente para o Mascote 🐱 (+5)  
❌ Compartilhar conteúdos da Marcha (+5)  
❌ Vencer o desafio da aula (+5)  
❌ Vir com o visual da sua Casa (+5)  
❌ **Postar no Feed em Collab (+10)** ⚠️  
❌ **Evolução geral (física/técnica) (+10)** ⚠️  
❌ **Participar de Eventos/Passeios (+15)** ⚠️  
❌ **Indicar amigo para aula experimental (+15)** ⚠️  
❌ **Destaque da aula (O melhor do dia) (+15)** ⚠️  
❌ **Casa mais animada da semana (+20)** ⚠️  
❌ **Indicação que fecha plano (+30)** ⚠️  
❌ **Subir de nível (Avaliação) (+50)** 🚨  
❌ **Pomo de Ouro (+50)** 🚨  
❌ Falta sem aviso prévio (-5)  
❌ Desafio não executado (-5)  
❌ Acumular 2 cartões amarelos (-10)  
❌ Prancha (tempo recorde) (+10)  
❌ Recorde de abdominal (+10)  
❌ Vencer Duelo de Casas (+20)  
❌ Missão Fotográfica (+15)  
❌ Chair Explosiva (+10)  
❌ Fazer Story em dupla (Casas diferentes) (+5)  
❌ Arte da Casa (Desenho/Cartaz) (+15)  
❌ Escudo (Proteção) (+0)  

---

## 🔐 SISTEMA DE HASH ÚNICO (Anti-reutilização)

✅ **Implementado e ativo!**

**Como funciona:**
- Cada carta lançada gera um código único no formato: **MUP-XXXX**
- Exemplo: `MUP-5KA7F2`, `MUP-7LB9X3`
- O hash é armazenado no banco com índice UNIQUE
- Se houver tentativa de reutilização, o sistema **BLOQUEIA** automaticamente
- Log no console: `🔐 Hash gerado: MUP-XXXX (tentativas: 1)`

**Campos adicionados:**
- `active_cards.hash_code` (TEXT UNIQUE)
- Índice único: `idx_active_cards_hash`

---

## 🎨 PAINEL DA TAMARA - LISTA LIMPA

Ao abrir **"Lançar Pontos"**, a Tamara agora vê apenas:

```
CATEGORIA / REGRA:
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Presença em Aula (+1)
  Usar a Cor da Casa (+1)
  Story (@marchapilates) (+1)
  Reels ou Feed (+2)
  Desafio de Sala (Aleatório) (+2)
  Evolução Técnica (+3)
  Indicação (Experimental) (+3)
  Conversão (Virou Aluno) (+2)
  Falta sem justificativa (-2)
  Pomo - Meta Base (+3)
  Pomo - Recorde (+5)
  Capitão (Bônus Fixo Mensal) (+5)
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NADA DE:**
- ❌ "Presente para o Mascote"
- ❌ "Ser legal"
- ❌ "Pomo de Ouro (+50)"
- ❌ "Casa mais animada (+20)"

---

## 🏆 SISTEMA DO POMO (Recordes)

**Lógica Corrigida:**

1. **Meta Base atingida**: +3 pontos ✅
2. **Quebra de Recorde** (Pegar o Pomo): +5 pontos + Posse ✅
3. **Posse volante**: Casa mantém o troféu até ser superada ✅
4. **Fechamento mensal**: Casa com posse final recebe **1 Carta Lendária** ✅

**IMPORTANTE:**
- ✅ Pomo **NÃO** vale +50 pontos (regra antiga apagada)
- ✅ Pomo vale +5 pontos + o troféu de posse
- ✅ O 10º Ponto agora funciona corretamente (saldo de Pomos)

---

## 📁 BARALHO DE PODER (15 Cartas)

**Caminho local**: `C:\Marcha\cartas\`

**Cartas vinculadas:**
1. spoiler.jpeg (Comum)
2. vida.jpeg (Comum)
3. senhorinha.jpeg (Comum)
4. marombinha.jpeg (Comum)
5. ladino.jpeg (Rara)
6. zica.jpeg (Rara)
7. reverso.jpeg (Rara)
8. influencer.jpeg (Épica)
9. coringa.jpeg (Épica)
10. trapaca.jpeg (Épica)
11. var.jpeg (Lendária)
12. tandera.jpeg (Lendária)
13. invisibilidade.jpeg (Lendária)
14. alianca.jpeg (Lendária)
15. golpe de estado.jpeg (Lendária)

**Rota de acesso**: `/cartas/[nome].jpeg`

---

## ✅ CONFIRMAÇÃO FINAL

### Verificações Executadas:

```sql
-- Total de regras
SELECT COUNT(*) FROM scoring_rules WHERE active = 1;
-- Resultado: 12 regras ✅

-- Regras obsoletas (deve ser 0)
SELECT COUNT(*) FROM scoring_rules WHERE value > 5 OR value < -2;
-- Resultado: 0 ✅

-- Máximo valor de pontos
SELECT MAX(value) FROM scoring_rules;
-- Resultado: 5 (Pomo Recorde ou Capitão) ✅

-- Campo hash_code existe
PRAGMA table_info(active_cards);
-- hash_code | TEXT | 0 | NULL | 0 ✅

-- Índice único ativo
SELECT * FROM sqlite_master WHERE name = 'idx_active_cards_hash';
-- Existe ✅
```

---

## 🚀 PRÓXIMOS PASSOS

### ✅ O que conferir agora:

1. **Abrir**: `http://localhost:3000/casa_detalhe.html?id=1`
2. **Clicar**: "+ Pontos"
3. **Verificar**: Lista com apenas 12 regras
4. **Lançar**: Uma Falta (-2) e confirmar subtração
5. **Lançar**: Uma carta e verificar hash no console:
   ```
   🔐 Hash gerado: MUP-XXXX (tentativas: 1)
   ```

### ⚠️ Por que isso é crítico:

- Se o sistema mantivesse "Pomo de Ouro (+50)", uma única ação valeria **25x mais** que Presença (+2)
- A Copa seria decidida em 1 dia, não em 10 meses
- O 10º Ponto bugaria completamente (esperava +5, mas receberia +50)

### 🎉 Resultado:

✅ **SISTEMA LIMPO**  
✅ **Regulamento 2026 ativo**  
✅ **Teto de pontos: +5**  
✅ **Hash único funcionando**  
✅ **Pomo corrigido (+5, não +50)**  

---

## 📞 SUPORTE

Se aparecer alguma regra obsoleta:

```bash
cd C:\Marcha\backend
node apply_limpeza_2026.js
```

**O SISTEMA ESTÁ PRONTO E LIMPO! 🎉**
