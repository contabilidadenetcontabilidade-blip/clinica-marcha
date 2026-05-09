let HOUSE_ID = null;
let currentAthletes = [];
let currentRules = [];

// Lê o usuário logado para controle de permissões
const _currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const _isAdmin = _currentUser.id === 9999;

function getHouseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  // Valida se o ID é um número válido
  if (!id || !/^\d+$/.test(id)) {
    return null;
  }
  return parseInt(id, 10);
}

async function loadDashboard() {
  if (!HOUSE_ID) return;
  try {
    showLoading('athletes-list', 'Carregando dados da casa...');
    const res = await fetch(`/api/houses/${HOUSE_ID}/dashboard`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar dados da casa: ' + (errorData.error || res.status));
      return;
    }
    const data = await res.json();
    const { house, totalPoints, bestCategory, athletes } = data;

    document.getElementById('house-name-top').textContent = house.name;
    document.getElementById('house-name').textContent = house.name;
    document.getElementById('total-points').textContent = totalPoints;
    document.getElementById('house-crest').src = house.crest || '';

    // aplica cor da casa como variável global
    if (house.color) {
      document.documentElement.style.setProperty('--house-color', house.color);
      const isYellow = house.color.toUpperCase() === '#FFFF00' || house.name.toLowerCase() === 'chair';
      document.documentElement.style.setProperty('--house-text-color', isYellow ? '#000000' : '#ffffff');
    }

    const bestCatEl = document.getElementById('best-category');
    if (bestCategory && bestCategory.name) {
      bestCatEl.textContent = `${bestCategory.name} (${bestCategory.total_points} pts)`;
    } else {
      bestCatEl.textContent = 'Nenhuma categoria se destacou ainda';
    }

    // atualiza currentAthletes para usar nos selects do modal
    currentAthletes = data.athletes || [];

    const rankingList = document.getElementById('athletes-list');
    rankingList.innerHTML = '';

    if (!currentAthletes.length) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum atleta cadastrado ainda.';
      rankingList.appendChild(li);
    } else {
      currentAthletes.forEach((ath, index) => {
        const li = document.createElement('li');
        li.className = 'athlete-row';

        const nameBtn = document.createElement('button');
        nameBtn.className = 'athlete-name-btn';
        nameBtn.innerHTML = `${index + 1}. ${ath.name} ${ath.is_captain == 1 ? '⭐(Capitão)' : ''}`;
        nameBtn.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `atleta_detalhe.html?id=${ath.id}`;
        };

        const captainBtn = document.createElement('button');
        captainBtn.className = ath.is_captain == 1 ? 'btn-secondary' : 'btn-primary';
        captainBtn.style.padding = '2px 8px';
        captainBtn.style.fontSize = '0.8rem';
        captainBtn.style.marginLeft = '10px';
        captainBtn.textContent = ath.is_captain == 1 ? 'Remover Capitão' : 'Fazer Capitão';
        captainBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await fetch(`/api/athletes/${ath.id}/captain`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_captain: ath.is_captain == 1 ? false : true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
            loadDashboard();
          } catch (err) {
            alert(err.message);
          }
        };

        const pointsSpan = document.createElement('span');
        pointsSpan.className = 'athlete-points';
        pointsSpan.textContent = `${ath.total_points} pts`;

        const nameContainer = document.createElement('div');
        nameContainer.style.display = 'flex';
        nameContainer.style.alignItems = 'center';
        nameContainer.appendChild(nameBtn);
        // Botão de capitão: apenas admin (id=9999) vê
        if (_isAdmin) {
          nameContainer.appendChild(captainBtn);
        }

        li.appendChild(nameContainer);
        li.appendChild(pointsSpan);
        rankingList.appendChild(li);
      });
    }


    // atualiza selects do modal de pontos
    populateScoreModalSelects();

  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar casa.');
  }
}

async function loadRules() {
  try {
    const res = await fetch('/api/rules');
    if (!res.ok) {
      console.error('Erro ao carregar regras:', res.status);
      return;
    }
    currentRules = await res.json();
    populateScoreModalSelects();
  } catch (err) {
    console.error(err);
    showError('Erro ao carregar regras de pontuação');
  }
}

function populateScoreModalSelects() {
  const selAthlete = document.getElementById('select-athlete');
  const selRule = document.getElementById('select-rule');
  if (!selAthlete || !selRule) return;

  selAthlete.innerHTML = '';
  currentAthletes.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.name} (${a.total_points} pts)`;
    selAthlete.appendChild(opt);
  });

  selRule.innerHTML = '';
  currentRules.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    const sinal = r.value >= 0 ? '+' : '';
    opt.textContent = `${r.name} (${sinal}${r.value})`;
    selRule.appendChild(opt);
  });
}

// ------- Modais -------

function openAddAthlete() {
  document.getElementById('modal-athlete').classList.remove('hidden');
}

function closeAddAthlete() {
  document.getElementById('modal-athlete').classList.add('hidden');
}

function openAddScore() {
  if (!currentAthletes.length) {
    showError('Cadastre pelo menos um atleta primeiro.');
    return;
  }
  if (!currentRules.length) {
    showError('Cadastre pelo menos uma regra de pontuação na tela de Regras.');
    return;
  }
  document.getElementById('modal-score').classList.remove('hidden');

  // Trigger change event to load thumbnail for initially selected rule
  const selRule = document.getElementById('select-rule');
  if (selRule && selRule.options.length > 0) {
    selRule.dispatchEvent(new Event('change'));
  }
}

function closeAddScore() {
  document.getElementById('modal-score').classList.add('hidden');
}

// ------- Eventos -------

document.addEventListener('DOMContentLoaded', () => {
  HOUSE_ID = getHouseIdFromUrl();
  if (!HOUSE_ID) {
    alert('ID da casa não informado.');
    window.location.href = 'cup.html';
    return;
  }

  // eventos dos formulários
  const formAthlete = document.getElementById('form-athlete');
  formAthlete.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formAthlete);
    const name = formData.get('name');
    const submitBtn = formAthlete.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, house_id: HOUSE_ID })
      });
      const data = await res.json();
      if (!res.ok) {
        showError('Erro ao criar atleta: ' + (data.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }
      showSuccess('Atleta cadastrado com sucesso!');
      formAthlete.reset();
      closeAddAthlete();
      loadDashboard();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao criar atleta.');
      setButtonLoading(submitBtn, false);
    }
  });

  const formScore = document.getElementById('form-score');
  formScore.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formScore);
    const athlete_id = formData.get('athlete_id');
    const rule_id = formData.get('rule_id');
    const submitBtn = formScore.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete_id, rule_id })
      });
      const data = await res.json();
      if (!res.ok) {
        showError('Erro ao registrar pontos: ' + (data.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }
      showSuccess('Pontos registrados com sucesso!');
      formScore.reset();
      closeAddScore();
      loadDashboard();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao registrar pontos.');
      setButtonLoading(submitBtn, false);
    }
  });

  const ruleSelect = document.getElementById('select-rule');
  if (ruleSelect) {
    // Add container for thumbnail and loading state inside the modal
    const previewContainer = document.createElement('div');
    previewContainer.id = 'rule-preview-container';
    previewContainer.style.marginTop = '15px';
    previewContainer.style.display = 'flex';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.gap = '15px';
    previewContainer.style.minHeight = '60px'; // Prevent jumping when loading

    const loadingText = document.createElement('span');
    loadingText.id = 'rule-loading-text';
    loadingText.textContent = 'Carregando...';
    loadingText.style.display = 'none';
    loadingText.style.color = 'var(--gold, #FFD700)';
    loadingText.style.fontStyle = 'italic';

    const thumbnailImg = document.createElement('img');
    thumbnailImg.id = 'rule-thumbnail';
    thumbnailImg.style.display = 'none';
    thumbnailImg.style.width = '45px';
    thumbnailImg.style.height = '60px';
    thumbnailImg.style.objectFit = 'cover';
    thumbnailImg.style.borderRadius = '6px';
    thumbnailImg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';

    previewContainer.appendChild(loadingText);
    previewContainer.appendChild(thumbnailImg);

    // Insert right after the rule select
    ruleSelect.parentNode.insertBefore(previewContainer, ruleSelect.nextSibling);

    ruleSelect.addEventListener('change', (e) => {
      const selectedRuleId = parseInt(e.target.value, 10);
      const rule = currentRules.find(r => r.id === selectedRuleId);

      if (rule && rule.image_path) {
        loadingText.style.display = 'block';
        thumbnailImg.style.display = 'none';

        // Simulate loading or load the image
        const img = new Image();
        img.onload = () => {
          thumbnailImg.src = img.src;
          loadingText.style.display = 'none';
          thumbnailImg.style.display = 'block';
        };
        img.onerror = () => {
          loadingText.textContent = 'Arte não encontrada';
          setTimeout(() => { loadingText.style.display = 'none'; }, 2000);
        };
        // Small delay to make the "Carregando..." visible if the image is cached
        setTimeout(() => {
          img.src = rule.image_path;
        }, 300);

      } else {
        loadingText.style.display = 'none';
        thumbnailImg.style.display = 'none';
      }
    });
  }

  // carrega dados iniciais
  loadDashboard();
  loadRules();
});
