let HOUSE_ID = null;
let currentAthletes = [];
let currentRules = [];

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
        nameBtn.textContent = `${index + 1}. ${ath.name}`;
        nameBtn.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `atleta_detalhe.html?id=${ath.id}`;
        };

        const pointsSpan = document.createElement('span');
        pointsSpan.className = 'athlete-points';
        pointsSpan.textContent = `${ath.total_points} pts`;

        li.appendChild(nameBtn);
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

  // carrega dados iniciais
  loadDashboard();
  loadRules();
  loadGallery();

  // Show controls if admin
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === 'admin') {
    document.getElementById('gallery-controls').style.display = 'block';
  }
});

async function loadGallery() {
  if (!HOUSE_ID) return;
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '<p style="color:#666; width:100%;">Carregando fotos...</p>';

  try {
    const res = await fetch(`/api/houses/${HOUSE_ID}/photos`);
    if (!res.ok) throw new Error("Erro API");
    const photos = await res.json();

    grid.innerHTML = '';
    if (photos.length === 0) {
      grid.innerHTML = '<p style="color:#aaa; font-style:italic;">Nenhuma foto na galeria.</p>';
      return;
    }

    const user = JSON.parse(localStorage.getItem('user')); // Get user inside to check permissions
    const isAdmin = user && user.role === 'admin';

    photos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'gallery-item';

      let deleteBtn = '';
      if (isAdmin) {
        deleteBtn = `<button class="delete-photo-btn" onclick="deleteGalleryPhoto(${p.id})">×</button>`;
      }

      div.innerHTML = `
                <img src="${p.photo_url}" onclick="window.open('${p.photo_url}', '_blank')">
                ${deleteBtn}
            `;
      grid.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="color:red;">Erro ao carregar fotos.</p>';
  }
}

async function uploadGalleryPhoto(input) {
  if (input.files.length === 0) return;
  const file = input.files[0];

  const formData = new FormData();
  formData.append('photo', file);

  // Show uploading...
  const controls = document.getElementById('gallery-controls');
  const btn = controls.querySelector('button');
  const originalText = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    const res = await fetch(`/api/houses/${HOUSE_ID}/photos`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      showSuccess("Foto adicionada!");
      loadGallery();
    } else {
      showError("Erro ao enviar imagem.");
    }
  } catch (err) {
    console.error(err);
    showError("Erro de conexão.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
    input.value = ''; // Reset input to allow same file selection again
  }
}

async function deleteGalleryPhoto(id) {
  if (!confirm("Apagar esta foto?")) return;
  try {
    const res = await fetch(`/api/houses/photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showSuccess("Foto removida.");
      loadGallery();
    } else {
      showError("Erro ao apagar.");
    }
  } catch (e) {
    showError("Erro de conexão.");
  }
}
