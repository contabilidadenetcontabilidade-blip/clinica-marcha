async function loadAthleteDetail() {
    const params = new URLSearchParams(window.location.search);
    const athleteIdStr = params.get('id');
    
    // Valida se o ID é um número válido
    if (!athleteIdStr || !/^\d+$/.test(athleteIdStr)) {
      showError('Atleta inválido.');
      setTimeout(() => history.back(), 2000);
      return;
    }
    
    const athleteId = parseInt(athleteIdStr, 10);
  
    try {
      showLoading('scores-list', 'Carregando dados do atleta...');
      
      // dados básicos do atleta
      const resAth = await fetch(`/api/athletes/${athleteId}`);
      if (!resAth.ok) {
        const errorData = await resAth.json().catch(() => ({}));
        showError('Erro ao carregar atleta: ' + (errorData.error || resAth.status));
        setTimeout(() => history.back(), 2000);
        return;
      }
      const athlete = await resAth.json();
  
      document.getElementById('athlete-header').textContent = athlete.name;
      document.getElementById('athlete-name').textContent = athlete.name;
      document.getElementById('athlete-house').textContent = `Casa: ${athlete.house_name || '-'}`;
  
      // histórico de pontos
      const resScores = await fetch(`/api/athletes/${athleteId}/scores`);
      if (!resScores.ok) {
        const errorData = await resScores.json().catch(() => ({}));
        showError('Erro ao carregar histórico: ' + (errorData.error || resScores.status));
        return;
      }
      const scores = await resScores.json();
  
      let total = 0;
      scores.forEach(s => {
        total += s.value || 0;
      });
      document.getElementById('athlete-total').textContent =
        `Total de pontos: ${total} pts`;
  
      const list = document.getElementById('scores-list');
      list.innerHTML = '';
  
      if (!scores.length) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum ponto registrado ainda.';
        list.appendChild(li);
        return;
      }
  
      scores.forEach(s => {
        const li = document.createElement('li');
        li.className = 'score-row';
  
        const ruleSpan = document.createElement('span');
        ruleSpan.className = 'score-rule';
        ruleSpan.textContent = s.rule_name;
  
        const valueSpan = document.createElement('span');
        valueSpan.className = 'score-value';
        const sinal = s.value < 0 ? '−' : '+';
        valueSpan.textContent = `${sinal}${Math.abs(s.value)} pts`;
  
        li.appendChild(ruleSpan);
        li.appendChild(valueSpan);
        list.appendChild(li);
      });
  
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao carregar dados do atleta.');
    }
  }
  
  document.addEventListener('DOMContentLoaded', loadAthleteDetail);
  