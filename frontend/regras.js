async function loadRules() {
    try {
      showLoading('rules-list', 'Carregando regras...');
      const res = await fetch('/api/rules');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError('Erro ao carregar regras: ' + (errorData.error || res.status));
        return;
      }
      const rules = await res.json();
      const list = document.getElementById('rules-list');
      list.innerHTML = '';
      if (!rules.length) {
        const li = document.createElement('li');
        li.textContent = 'Nenhuma regra cadastrada ainda.';
        list.appendChild(li);
      } else {
        rules.forEach(r => {
          const li = document.createElement('li');
          li.className = 'rule-item';
          li.dataset.ruleId = r.id;
          
          const ruleInfo = document.createElement('span');
          const sinal = r.value >= 0 ? '+' : '';
          ruleInfo.textContent = `${r.name} (${sinal}${r.value} pts)`;
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-rule-btn';
          deleteBtn.textContent = '🗑️';
          deleteBtn.title = 'Excluir regra';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteRule(r.id, r.name);
          };
          
          li.appendChild(ruleInfo);
          li.appendChild(deleteBtn);
          list.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao carregar regras');
    }
  }

async function deleteRule(ruleId, ruleName) {
  if (!confirm(`Tem certeza que deseja excluir a regra "${ruleName}"?\n\nIsso não excluirá os pontos já registrados, mas a regra ficará inativa.`)) {
    return;
  }

  try {
    showLoading('rules-list', 'Excluindo regra...');
    const res = await fetch(`/api/rules/${ruleId}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError('Erro ao excluir regra: ' + (data.error || res.status));
      return;
    }
    
    showSuccess('Regra excluída com sucesso!');
    loadRules();
  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao excluir regra');
  }
}
  
  document.addEventListener('DOMContentLoaded', () => {
    loadRules();
  
    const form = document.getElementById('form-rule');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = formData.get('name');
      const value = formData.get('value');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);

      try {
        const res = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, value })
        });
        const data = await res.json();
        if (!res.ok) {
          showError('Erro ao criar regra: ' + (data.error || res.status));
          setButtonLoading(submitBtn, false);
          return;
        }
        showSuccess('Regra criada com sucesso!');
        form.reset();
        loadRules();
        setButtonLoading(submitBtn, false);
      } catch (err) {
        console.error(err);
        showError('Erro inesperado ao criar regra.');
        setButtonLoading(submitBtn, false);
      }
    });
  });
  