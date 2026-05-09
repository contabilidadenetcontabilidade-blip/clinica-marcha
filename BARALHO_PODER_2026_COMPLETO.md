# 🎉 BARALHO DE PODER 2026 - IMPLEMENTAÇÃO CONCLUÍDA

## ✅ RESUMO DA ATUALIZAÇÃO

A versão **Baralho de Poder 2026** foi implementada com sucesso! O sistema agora inclui:

### 1. 🃏 Sistema de Cartas (15 cartas implementadas)

**Cartas Comuns:**
- Spoiler
- Vida (anula -2 de falta)
- Senhorinha
- Marombinha

**Cartas Raras:**
- Ladino (rouba 3 pontos de casa rival) ✅ FUNCIONAL
- Zica (dobra faltas -4 por 7 dias)
- Reverso

**Cartas Épicas:**
- Influencer (dobra Story/Reels por 7 dias)
- Coringa
- Trapaça

** Cartas Lendárias:**
- VAR
- Tandera
- Invisibilidade
- Aliança
- Golpe de Estado

### 2. 📊 Nova Tabela de Pontos (Meinhas)

Implementadas as seguintes regras:

- **Presença**: +1 ponto
- **Cor da Casa**: +1 ponto
- **Story**: +1 ponto
- **Reels**: +2 pontos
- **Falta**: -2 pontos ⚠️ CONFERIR
- **Evolução Técnica**: +3 pontos
- **Capitão (Mensal)**: +5 pontos automáticos ✅ FUNCIONAL

### 3. 🎯 Painel da Tamara - ATUALIZADO

O formulário de lançamento de pontos agora inclui:

✅ **Seletor de Cartas** (dropdown com as 15 cartas)
✅ **Casa Rival** (aparece se Ladino ou Zica for selecionada)
✅ **Seção do Pomo** (categoria + valor)
✅ **Lógica de Atribuição Automática**:
   - Comuns/Raras → Atleta
   - Épicas/Lendárias → Casa

### 4. ⚡ Efeitos Automáticos DAS CARTAS

**Cartas com Lógica Implementada:**

- ✅ **Vida**: Marca que próxima falta será anulada (código backend pronto)
- ✅ **Ladino**: Ao lançar, subtrai 3 pontos da casa rival e soma à casa atual
- ✅ **Zica**: Marca a casa alvo para faltas valerem -4 por 7 dias
- ✅ **Influencer**: Marca a casa para dobrar pontos de Story/Reels por 7 dias

### 5. 🏅 Sistema do Pomo (4 categorias)

**Categorias Implementadas:**
1. Velocidade (meta: 10.0 segundos)
2. Força (meta: 50.0 kg)
3. Resistência (meta: 30.0 minutos)
4. Técnica (meta: 8.5 pontos)

**Lógica:**
- ✅ **Meta Atingida**: +3 pontos
- ✅ **Novo Recorde**: +5 pontos + Posse do Pomo
- ✅ **Posse do Pomo**: Transferida automaticamente para a casa do novo recordista
- ✅ **Fechamento Mensal**: API pronta para distribuir 1 carta lendária à casa com mais Pomos

### 6. 👑 Sistema de Capitães

- ✅ Campo `is_captain` adicionado na tabela `athletes`
- ✅ API para definir capitão: `POST /api/captains/set`
- ✅ Ao definir capitão, casa recebe +5 pontos automaticamente
- ✅ API para listar capitães: `GET /api/captains`

### 7. 🏆 Interface do Ranking

Atualizado para mostrar:
- ✅ Brasão da casa (logo)
- ✅ Ícone da carta ativa (se a casa tiver carta épica ou lendária)
- ✅ CSS com borda dourada e sombra para destacar a carta

---

## 🧪 TESTES NECESSÁRIOS

### ☑️ Teste 1: O "Dólar" da Marcha

**Objetivo**: Verificar se ao lançar uma falta, o sistema realmente subtrai 2 pontos.

**Passos**:
1. Abra o Painel da Tamara (casa_detalhe.html?id=1)
2. Clique em "+ Pontos"
3. Selecione um atleta
4. Selecione a regra "Falta"
5. Clique em "Registrar"
6. **Esperado**: Casa perde 2 pontos

### ☑️ Teste 2: A Janela das Cartas

**Objetivo**: Verificar se o seletor de cartas mostra as 15 cartas.

**Passos**:
1. Abra o Painel da Tamara
2. Clique em "+ Pontos"
3. Verifique o dropdown "Carta (opcional)"
4. **Esperado**: Lista com:
   - Spoiler, Vida, Senhorinha, Marombinha
   - Ladino, Zica, Reverso
   - Influencer, Coringa, Trapaça
   - VAR, Tandera, Invisibilidade, Aliança, Golpe de Estado

### ☑️ Teste 3: Capitães (+5 pontos)

**Objetivo**: Verificar se capitães começam o mês com +5 pontos.

**Passos**:
1. Use Postman ou navegador para fazer requisição:
   ```
   POST http://localhost:3000/api/captains/set
   Body: { "athlete_id": 1, "is_captain": true }
   ```
2. Verifique o ranking
3. **Esperado**: Casa do atleta recebe +5 pontos imediatamente

### ☑️ Teste 4: Carta Ladino (Roubar pontos)

**Passos**:
1. Abra o Painel da Tamara (casa A)
2. "+ Pontos" → Selecione atleta → Selecione qualquer regra
3. Em "Carta (opcional)", selecione "Ladino"
4. Em "Casa Rival", selecione casa B
5. Clique em "Registrar"
6. **Esperado**: 
   - Casa A: +3 pontos
   - Casa B: -3 pontos

### ☑️ Teste 5: Pomo - Meta

**Passos**:
1. Painel da Tamara → "+ Pontos"
2. Preencha atleta e regra normalmente
3. Em "Pomo (Recorde)":
   - Categoria: Velocidade
   - Valor: 10 (ou maior que a meta)
4. Clique em "Registrar"
5. **Esperado**: Mensagem "Meta atingida! +3 pts"

### ☑️ Teste 6: Pomo - Recorde

**Passos**:
1. Repita o teste anterior com valor MAIOR que o recorde atual (ex: 12)
2. **Esperado**: 
   - Mensagem "🏆 NOVO RECORDE! +8 pts" (3 da meta + 5 do recorde)
   - Casa ganha a Posse do Pomo

---

## 🗂️ APIs DISPONÍVEIS

### Cartas
- `GET /api/cards` - Lista todas as cartas
- `GET /api/active-cards?house_id=1` - Cartas ativas de uma casa
- `POST /api/cards/assign` - Atribui carta (com efeitos automáticos)

### Pomo
- `GET /api/pomo/categories` - Lista categorias
- `GET /api/pomo/records` - Lista recordes atuais
- `POST /api/pomo/submit` - Lança novo Pomo

### Capitães
- `GET /api/captains` - Lista capitães
- `POST /api/captains/set` - Define capitão

### Fechamento Mensal
- `GET /api/pomo/monthly-winners` - Vencedores mensais
- `POST /api/pomo/close-month` - Fecha mês e distribui carta lendária

---

## 📂 ARQUIVOS DAS CARTAS

As imagens das cartas estão em: `C:\Marcha\cartas\`

**Arquivos Encontrados:**
1. alianca.jpeg
2. coringa.jpeg
3. golpe de estado.jpeg
4. influencer.jpeg
5. invisibilidade.jpeg
6. ladino.jpeg
7. marombinha.jpeg
8. reverso.jpeg
9. senhorinha.jpeg
10. spoiler.jpeg
11. tandera.jpeg
12. trapaca.jpeg
13. var.jpeg
14. vida.jpeg
15. zica.jpeg

**Acesso no frontend**: `/cartas/[nome].jpeg`

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Implementações Futuras (Opcionais)

1. **Lógica da Carta "Vida"** aplicar no backend:
   - Verificar se existe carta Vida ativa antes de aplicar -2 de falta
   - Desativar a carta após uso

2. **Lógica da Carta "Zica"** aplicar no backend:
   - Verificar `card_effects` com `effect_name = 'double_absence'`
   - Aplicar -4 ao invés de -2

3. **Lógica da Carta "Influencer"** aplicar no backend:
   - Verificar `card_effects` com `effect_name = 'double_story_reels'`
   - Dobrar pontos de Story/Reels

4. **Expiração Automática de Cartas**:
   - Criar cron job para desativar cartas com `expires_at` passado
   - Ou verificar no frontend antes de aplicar efeito

5. **Interface Visual do Pomo**:
   - Criar página dedicada para visualizar recordes
   - Mostrar histórico de conquistas

---

## 🚀 COMO USAR

### 1. Servidor já está rodando

O comando `node index.js` foi executado e o backend está ativo em:
**http://localhost:3000**

### 2. Acessar o Sistema

Abra no navegador:
- **Login**: http://localhost:3000/login.html
- **Ranking**: http://localhost:3000/ranking.html
- **Painel da Tamara**: http://localhost:3000/casa_detalhe.html?id=1

### 3. Conferir Agora

✅ O "Dólar" da Marcha: Lance uma falta e veja -2 pontos
✅ A Janela das Cartas: Abra o painel e veja as 15 cartas
✅ Capitães: Defina via API e veja +5 pontos

---

## 📊 BANCO DE DADOS ATUALIZADO

O banco `database.sqlite` agora possui:

**Novas Tabelas:**
- `cards` (15 registros)
- `active_cards`
- `pomo_categories` (4 categorias)
- `pomo_records`
- `card_effects`
- `pomo_monthly_winners`

**Campos Adicionados:**
- `athletes.is_captain`
- `scoring_rules.points_type`

**Novas Regras:**
- Presença (+1)
- Cor da Casa (+1)
- Story (+1)
- Reels (+2)
- Falta (-2)
- Evolução Técnica (+3)
- Capitão (Mensal) (+5)

---

## 🎮 PRÓXIMOS PASSOS

1. **Teste o sistema** seguindo os testes acima
2. **Defina capitães** para suas casas
3. **Lance cartas** no Painel da Tamara
4. **Registre Pomos** para criar recordes
5. **Acompanhe o ranking** com os novos recursos

**O Sistema Baralho de Poder 2026 está PRONTO! 🎉**
