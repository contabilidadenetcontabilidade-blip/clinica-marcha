# 🎴 Sistema de Cartas — Documentação

## Resumo
- Total: 15 cartas
- Cartas com alvo: 8
- Cartas sem alvo: 7
- Status: ✅ 100% funcional

## Cartas que Exigem Alvo
1. **Spoiler** — Revela a parcial de meinhas do mês de uma casa adversária.
2. **Ladino** — Inicia um ataque de roubo de 3 meinhas (24h de janela para reação).
3. **Zica** — As faltas da casa adversária valem o dobro por 1 semana.
4. **Coringa** — Por uma semana, as conquistas de um capitão adversário vão para você.
5. **Trapaça** — Aumenta em 15% a meta mensal de meinhas de uma casa adversária.
6. **VAR** — Obriga um adversário a repetir um Pomo; se ele falhar, você rouba o Pomo.
7. **Tandera** — Revela todas as cartas que uma casa adversária possui na mão através de um modal especial.
8. **Aliança** — Um capitão rival disputa um Pomo por você. Se ele vencer, o Pomo é seu.

## Cartas sem Alvo (Uso Direto / Reação)
1. **Vida** — Anula a perda de pontos de 1 falta (remove a última do histórico).
2. **Senhorinha** — O aluno ganha o direito de realizar um desafio difícil valendo 2 meinhas.
3. **Marombinha** — O aluno ganha o direito de realizar um desafio fácil valendo 1 meinha.
4. **Reverso** — O feitiço vira contra o feiticeiro (Reflete o ataque se usado como reação).
5. **Golpe de Estado** — A casa em último lugar rouba as conquistas da casa em primeiro por 1 semana.
6. **Invisibilidade** — Veta a ação de qualquer carta lançada contra você (Escudo de 7 dias ou reação imediata).
7. **Influencer** — Mídias sociais (Stories/Reels) valem o dobro de meinhas por 1 semana.

## Status de Implementação

| ID | Nome | Tipo | Implementação | Status |
|----|------|------|---|---|
| 16 | Coringa | Alvo | ✅ Backend + Frontend | ✅ OK |
| 17 | Tandera | Alvo | ✅ Backend + Modal Especial | ✅ OK |
| 18 | Trapaça | Alvo | ✅ Backend + Target Selection | ✅ OK |
| 19 | VAR | Alvo | ✅ Backend + card_queue | ✅ OK |
| 20 | Vida | Direto | ✅ Remove Lack Record | ✅ OK |
| 21 | Zica | Alvo | ✅ active_effects (7 dias) | ✅ OK |
| 22 | Ladino | Alvo | ✅ Ataque Pendente (24h) | ✅ OK |
| 23 | Marombinha | Direto | ✅ Soma +1 via Rule ID | ✅ OK |
| 24 | Reverso | Direto | ✅ Active Effect / Reaction | ✅ OK |
| 25 | Senhorinha | Direto | ✅ Soma +2 via Rule ID | ✅ OK |
| 26 | Spoiler | Alvo | ✅ SQL Subtraction/Query | ✅ OK |
| 27 | Aliança | Alvo | ✅ targetedCards Array | ✅ OK |
| 28 | Golpe de Estado | Direto | ✅ Auto-Target 1st Place | ✅ OK |
| 29 | Invisibilidade | Direto | ✅ active_effects (7 dias) | ✅ OK |
| 30 | Influencer | Direto | ✅ Rule-stable Multiplier | ✅ OK |

---
*Documentação gerada após auditoria e bug-fix em 25/04/2026.*
