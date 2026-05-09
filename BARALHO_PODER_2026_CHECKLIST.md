# ================================================================
# BARALHO DE PODER 2026 - CHECKLIST DE VERIFICAÇÃO
# ================================================================

## ✅ Banco de Dados

- [x] Tabela `cards` criada com 15 cartas
- [x] Tabela `active_cards` criada
- [x] Tabela `pomo_categories` criada com 4 categorias
- [x] Tabela `pomo_records` criada
- [x] Tabela `card_effects` criada
- [x] Tabela `pomo_monthly_winners` criada
- [x] Campo `is_captain` adicionado em `athletes`
- [x] Campo `points_type` adicionado em `scoring_rules`
- [x] Novas regras de pontuação criadas (Presença, Cor da Casa, Story, Reels, Falta, Evolução Técnica, Capitão)

## ✅ Backend API

- [x] GET /api/cards - Listar todas as cartas
- [x] GET /api/active-cards - Listar cartas ativas por casa/atleta
- [x] POST /api/cards/assign - Atribuir carta com efeitos automáticos
- [x] GET /api/pomo/categories - Listar categorias do Pomo
- [x] GET /api/pomo/records - Listar recordes atuais
- [x] POST /api/pomo/submit - Lançar novo Pomo (meta ou recorde)
- [x] GET /api/captains - Listar capitães atuais
- [x] POST /api/captains/set - Definir capitão
- [x] GET /api/pomo/monthly-winners - Vencedores mensais
- [x] POST /api/pomo/close-month - Fechar mês e distribuir carta lendária
- [x] Rota estática /cartas para servir imagens

## ✅ Frontend - Painel da Tamara (casa_detalhe.html/js)

- [x] Seletor de cartas no formulário de pontos
- [x] Campo de casa rival (para Ladino/Zica)
- [x] Seção do Pomo com categoria e valor
- [x] Função loadCards()
- [x] Função loadHouses()
- [x] Função loadPomoCategories()
- [x] Lógica de submissão de carta + pontos + Pomo
- [x] Mostrar/ocultar campos condicionalmente

## ✅ Frontend - Ranking (ranking.html)

- [x] Exibir brasão da casa
- [x] Exibir carta ativa (se houver)
- [x] CSS para ícone da carta (.active-card-icon)

## 🧐 TESTES A EXECUTAR

### 1. "Dólar" da Marcha (Falta -2)
```
1. Abrir Painel da Tamara
2. Selecionar regra "Falta"
3. Verificar se subtrai -2 pontos do atleta e da casa
```

### 2. Janela das Cartas
```
1. Abrir Painel da Tamara
2. Verificar se o seletor de cartas mostra todas as 15 cartas:
   - Spoiler, Vida, Senhorinha, Marombinha (Comuns)
   - Ladino, Zica, Reverso (Raras)
   - Influencer, Coringa, Trapaça (Épicas)
   - VAR, Tandera, Invisibilidade, Aliança, Golpe de Estado (Lendárias)
```

### 3. Capitães (+5 pontos iniciais)
```
1. Definir um atleta como capitão via POST /api/captains/set
2. Verificar se a casa recebe +5 pontos imediatamente
3. Verificar no ranking
```

### 4. Carta "Vida" (Anula -2 de falta)
```
1. Lançar carta Vida para um atleta
2. Lançar uma falta para o mesmo atleta
3. Verificar se o -2 foi anulado (implementação pendente no backend)
```

### 5. Carta "Ladino" (Roubar 3 pontos)
```
1. Selecionar carta Ladino
2. Selecionar casa rival
3. Verificar se 3 pontos foram subtraídos da rival e adicionados à casa atual
```

### 6. Carta "Zica" (Dobrar faltas por 7 dias)
```
1. Selecionar carta Zica
2. Selecionar casa alvo
3. Verificar se o efeito foi registrado em card_effects
4. Testar lançar falta na casa alvo e verificar se vale -4 ao invés de -2
```

### 7. Pomo - Meta (+3 pontos)
```
1. Lançar um Pomo com valor >= meta
2. Verificar se +3 pontos foram atribuídos
```

### 8. Pomo - Recorde (+5 pontos + Posse)
```
1. Lançar um Pomo com valor maior que o recorde atual
2. Verificar se +5 pontos foram atribuídos
3. Verificar se has_possession = 1 para a casa
```

## ⚠️ IMPLEMENTAÇÕES PENDENTES

1. **Lógica da Carta "Vida"** no backend - Verificar `card_effects` antes de aplicar -2 de falta
2. **Lógica da Carta "Zica"** no backend - Verificar `card_effects` e aplicar -4 ao invés de -2
3. **Lógica da Carta "Influencer"** no backend - Verificar `card_effects` e dobrar pontos de Story/Reels
4. **Expiração automática de cartas** - Cron job ou verificação no frontend
5. **Interface para mostrar Seção do Pomo** - Toggle ou sempre visível no modal
6. **Vincular imagens com extensão correta** (.jpeg vs .jpg)

## 📁 Arquivos Modificados

- backend/migration_baralho_poder_2026.sql
- backend/apply_migration_2026.js
- backend/index.js (+350 linhas de API)
- frontend/casa_detalhe.html
- frontend/casa_detalhe.js
- frontend/ranking.html

## 🚀 Como Iniciar

```bash
cd C:\Marcha\backend
node index.js
```

Abrir no navegador: http://localhost:3000
