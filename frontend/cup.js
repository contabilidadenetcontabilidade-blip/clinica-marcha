let housesData = [];

// Abre/fecha modal de criação de casa
function openCreateHouse() {
  document.getElementById("modal-casa").classList.remove("hidden");
}

function closeCreateHouse() {
  document.getElementById("modal-casa").classList.add("hidden");
}

// Busca totais de pontos de cada casa usando o dashboard
async function enrichHousesWithTotals(houses) {
  const enriched = [];

  for (const h of houses) {
    try {
      const res = await fetch(`/api/houses/${h.id}/dashboard`);
      if (!res.ok) {
        console.error('Erro ao carregar dashboard da casa', h.id, res.status);
        enriched.push({ ...h, total_points: 0 });
        continue;
      }
      const data = await res.json();
      enriched.push({
        ...h,
        total_points: data.totalPoints || 0
      });
    } catch (err) {
      console.error('Erro inesperado ao carregar dashboard da casa', h.id, err);
      enriched.push({ ...h, total_points: 0 });
    }
  }

  return enriched;
}

// Carrega casas e monta ranking visual
async function loadHouses() {
  try {
    showLoading('houses-list', 'Carregando ranking...');
    const res = await fetch('/api/houses');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar casas: ' + (errorData.error || res.status));
      return;
    }
    let houses = await res.json();

    if (!houses.length) {
      const list = document.getElementById("houses-list");
      list.innerHTML = "";
      const li = document.createElement("li");
      li.textContent = "Nenhuma casa cadastrada ainda.";
      list.appendChild(li);
      return;
    }

    // busca totalPoints usando o dashboard de cada casa
    houses = await enrichHousesWithTotals(houses);

    // ordena por pontos (maior -> menor)
    houses.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

    housesData = houses;

    const list = document.getElementById("houses-list");
    list.innerHTML = "";

    const maxPoints = houses.reduce(
      (max, h) => Math.max(max, h.total_points || 0),
      0
    );

    houses.forEach((h, index) => {
      const total = h.total_points || 0;

      const li = document.createElement("li");
      li.className = "house-row";
      li.style.borderLeft = `10px solid ${h.color || '#192C46'}`;
      li.onclick = () => {
        window.location.href = `casa_detalhe.html?id=${h.id}`;
      };

      const img = document.createElement("img");
      img.className = "house-crest";
      if (h.crest) {
        img.src = h.crest;
      } else {
        img.style.background = h.color || '#192C46';
      }

      const main = document.createElement("div");
      main.className = "house-main";

      const headerLine = document.createElement("div");
      headerLine.className = "house-header-line";

      const nameSpan = document.createElement("span");
      nameSpan.className = "house-name";
      nameSpan.textContent = `${index + 1}º — ${h.name}`;

      const pointsSpan = document.createElement("span");
      pointsSpan.className = "house-points";
      const sinal = total < 0 ? '−' : '';
      pointsSpan.textContent = `${sinal}${Math.abs(total)} pts`;

      headerLine.appendChild(nameSpan);
      headerLine.appendChild(pointsSpan);

      const bar = document.createElement("div");
      bar.className = "progress-bar";
      const fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.background = h.color || '#192C46';
      const width = maxPoints > 0 ? (total / maxPoints) * 100 : 0;
      fill.style.width = `${width}%`;
      bar.appendChild(fill);

      main.appendChild(headerLine);
      main.appendChild(bar);

      li.appendChild(img);
      li.appendChild(main);
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar casas.');
  }
}

// Form de criar casa
document.addEventListener("DOMContentLoaded", () => {
  loadHouses();
  loadProvasPendentes();

  const form = document.getElementById("form-casa");
  if (!form) return;

  // Validação de arquivo antes de enviar
  const crestInput = document.getElementById('crest-input');
  if (crestInput) {
    crestInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        // Valida tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showError('Arquivo muito grande. Tamanho máximo: 5MB');
          e.target.value = '';
          return;
        }

        // Valida tipo MIME
        if (file.type !== 'image/png') {
          showError('Apenas arquivos PNG são aceitos');
          e.target.value = '';
          return;
        }
      }
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const formData = new FormData(this);

      // Validação final antes de enviar
      const fileInput = this.querySelector('input[type="file"]');
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          showError('Arquivo muito grande. Tamanho máximo: 5MB');
          setButtonLoading(submitBtn, false);
          return;
        }
        if (file.type !== 'image/png') {
          showError('Apenas arquivos PNG são aceitos');
          setButtonLoading(submitBtn, false);
          return;
        }
      }

      const res = await fetch('/api/houses', {
        method: "POST",
        body: formData
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) { }

      if (!res.ok) {
        showError('Erro ao salvar casa: ' + (data && data.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : res.status));
        console.error('Resposta erro:', data);
        setButtonLoading(submitBtn, false);
        return;
      }

      showSuccess('Casa criada com sucesso!');
      this.reset();
      closeCreateHouse();
      loadHouses();
      setButtonLoading(submitBtn, false);

    } catch (err) {
      console.error(err);
      showError('Erro inesperado no envio da casa.');
      setButtonLoading(submitBtn, false);
    }
  });
});

// --- MARCH 2026 EXPANSION ---

async function loadHouseInventory(houseId) {
  if (!houseId) return;
  const grid = document.getElementById('house-cards-grid');
  grid.innerHTML = '<p style="color: #ccc;">Carregando...</p>';

  try {
    const res = await fetch(`/api/house/${houseId}/cards`);
    const cards = await res.json();

    grid.innerHTML = '';
    if (cards.length === 0) {
      grid.innerHTML = '<p style="color: #888; font-style: italic;">Nenhuma carta disponível nesta casa.</p>';
      return;
    }

    cards.forEach(card => {
      const div = document.createElement('div');
      div.style.width = '100px';
      div.style.textAlign = 'center';
      div.style.background = 'rgba(0,0,0,0.3)';
      div.style.padding = '5px';
      div.style.borderRadius = '8px';

      div.innerHTML = `
                <img src="${card.image_path}" style="width: 100%; border-radius: 6px; border: 1px solid #444; aspect-ratio: 2/3; object-fit: cover;">
                <div style="font-size: 0.7rem; color: #ccc; margin-top: 4px;">Portador:</div>
                <div style="font-size: 0.8rem; color: #fff; font-weight: bold;">${card.student_name.split(' ')[0]}</div>
            `;
      grid.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p style="color: red;">Erro ao carregar.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const houseSelect = document.getElementById('house-select');
  if (houseSelect) {
    try {
      const res = await fetch('/api/ranking'); // Reuse ranking API to get houses
      const houses = await res.json();
      houses.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = h.name;
        houseSelect.appendChild(opt);
      });

      houseSelect.addEventListener('change', (e) => loadHouseInventory(e.target.value));
    } catch (e) { console.error("Error loading houses for select:", e); }
  }
});

// --- SCORE REGISTRATION ---
const modalScore = document.getElementById('modal-score');

function openAddScore() {
  modalScore.classList.remove('hidden');
  loadScoreOptions();
}

// Make it globally available
window.openAddScore = openAddScore;

const btnAddScore = document.getElementById('add-score-btn');
if (btnAddScore) {
  btnAddScore.addEventListener('click', openAddScore);
}

async function loadScoreOptions() {
  const studentSelect = document.getElementById('score-student-select');
  const ruleSelect = document.getElementById('score-rule-select');

  // Load Students
  try {
    const res = await fetch('/api/patients'); // Assuming this endpoint exists or similar
    const students = await res.json();
    studentSelect.innerHTML = '<option value="">Selecione...</option>';
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      studentSelect.appendChild(opt);
    });
  } catch (e) { console.error("Error loading students", e); }

  // Load Rules
  try {
    const res = await fetch('/api/rules');
    const rules = await res.json();
    ruleSelect.innerHTML = '<option value="">Selecione...</option>';
    rules.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      // Show value in text
      const val = r.value > 0 ? `+${r.value}` : r.value;
      opt.textContent = `${r.name}`;
      opt.dataset.points = val;
      ruleSelect.appendChild(opt);
    });

    // Add event listener to auto-fill points display
    ruleSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const pointsDisplay = document.getElementById('score-points-display');
      if (pointsDisplay && selectedOption) {
        pointsDisplay.value = selectedOption.dataset.points || '';
      }
    });
  } catch (e) { console.error("Error loading rules", e); }
}

const formScore = document.getElementById('form-score');
if (formScore) {
  formScore.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      student_id: formData.get('student_id'),
      rule_id: formData.get('rule_id')
    };

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        alert('Pontos registrados!');
        modalScore.classList.add('hidden');
        loadHouses(); // Refresh ranking
      } else {
        alert('Erro: ' + (result.error || 'Desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  });
}

// --- GESTÃO DE PROVAS (CARD QUEUE) ---

async function loadProvasPendentes() {
  const container = document.getElementById('provas-pendentes-list');
  if (!container) return;

  try {
    const res = await fetch('/api/card-queue/pending');
    const provas = await res.json();

    if (!provas.length) {
      container.innerHTML = '<p style="color:#888; text-align:center; font-style: italic;">Nenhuma prova pendente no momento.</p>';
      return;
    }

    container.innerHTML = provas.map(p => {
      const dateStr = new Date(p.created_at).toLocaleString('pt-BR');
      return `
        <div style="background:#0a0a2e; border:1px solid #333; border-radius:8px; padding:16px; margin-bottom:12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="color:#FFD700; font-weight:bold; font-size:1.1rem; text-transform: uppercase;">${p.card_name}</span>
              <br>
              <span style="color:#aaa; font-size:0.9rem;">
                Invocador: <strong style="color:#fff;">${p.attacker_name || 'N/A'}</strong>
                &nbsp;|&nbsp;
                Alvo: <strong style="color:#fff;">${p.target_house_name || 'N/A'}</strong>
                ${p.allied_captain_name ? `<br>Apoio: <strong style="color:#fff;">${p.allied_captain_name}</strong>` : ''}
              </span>
              <br>
              <span style="color:#666; font-size:0.8rem;">📅 ${dateStr}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button onclick="resolverProva(${p.id}, 'VENCEU')" 
                style="background:#2e7d32; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.2s;">
                ✅ VENCEU
              </button>
              <button onclick="resolverProva(${p.id}, 'FRACASSOU')"
                style="background:#c62828; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.2s;">
                ❌ FRACASSOU
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar provas pendentes.</p>';
  }
}

async function resolverProva(id, result) {
  if (!confirm(`Confirma o resultado da prova como: ${result}?`)) return;
  
  try {
    const res = await fetch(`/api/card-queue/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    });
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message || 'Prova resolvida!');
      loadProvasPendentes();
      loadHouses(); // Atualiza ranking caso pontuação mude
    } else {
      alert('Erro ao resolver: ' + (data.error || 'Desconhecido'));
    }
  } catch (e) {
    alert('Erro de conexão ao resolver prova.');
  }
}

window.resolverProva = resolverProva;
window.loadProvasPendentes = loadProvasPendentes;

// --- GESTÃO DE FREQUÊNCIA (PRESENÇA DIÁRIA) ---

let currentAttendanceList = [];

function openAttendanceModal() {
  document.getElementById("attendance-modal").classList.remove("hidden");
  loadAttendanceList();
}

function closeAttendanceModal() {
  document.getElementById("attendance-modal").classList.add("hidden");
}

async function loadAttendanceList() {
  const container = document.getElementById('attendance-list');
  const houseFilter = document.getElementById('attendance-house-filter').value;
  container.innerHTML = '<p style="padding:20px; text-align:center; color:#666;">Carregando alunos...</p>';

  try {
    const res = await fetch('/api/patients?type=student&active=true');
    let students = await res.json();

    // Filtra por casa se necessário
    if (houseFilter !== "0") {
      students = students.filter(s => s.house_id == houseFilter);
    }

    currentAttendanceList = students;

    if (students.length === 0) {
      container.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">Nenhum aluno encontrado para este filtro.</p>';
      return;
    }

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        <thead style="background:#f5f5f5; position:sticky; top:0;">
          <tr>
            <th style="text-align:left; padding:10px; border-bottom:2px solid #ddd;">Aluno</th>
            <th style="text-align:center; padding:10px; border-bottom:2px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px; font-weight:500;">${s.name}</td>
              <td style="padding:10px; text-align:center;">
                <select class="att-status" data-patient="${s.id}" data-house="${s.house_id}" 
                        style="padding:5px; border-radius:4px; border:1px solid #ccc; width:120px;">
                  <option value="PRESENT" selected>✅ PRESENTE</option>
                  <option value="ABSENT">❌ FALTA</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="padding:20px; text-align:center; color:red;">Erro ao carregar alunos.</p>';
  }
}

async function saveAttendance() {
  const selects = document.querySelectorAll('.att-status');
  const attendances = Array.from(selects).map(sel => ({
    patient_id: sel.dataset.patient,
    house_id: sel.dataset.house,
    status: sel.value
  }));

  if (attendances.length === 0) return;

  const btn = document.querySelector('button[onclick="saveAttendance()"]');
  setButtonLoading(btn, true);

  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendances,
        admin_id: currentUser.id,
        admin_role: currentUser.role
      })
    });

    if (res.ok) {
      showSuccess(`Sucesso! ${attendances.length} presenças registradas.`);
      closeAttendanceModal();
      loadHouses(); // Atualiza ranking pois ganharam pontos
    } else {
      const data = await res.json();
      showError('Erro ao salvar: ' + (data.error || res.status));
    }
  } catch (err) {
    console.error(err);
    showError('Erro de conexão ao salvar frequências.');
  } finally {
    setButtonLoading(btn, false);
  }
}

window.openAttendanceModal = openAttendanceModal;
window.closeAttendanceModal = closeAttendanceModal;
window.loadAttendanceList = loadAttendanceList;
window.saveAttendance = saveAttendance;

// --- PROTEÇÃO DE ADMIN (TAMARA) ---
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = (currentUser.id === 9999) || (currentUser.role === 'admin' || currentUser.role === 'coach');

  // Se não for admin, oculta os botões
  if (!isAdmin) {
    const btnAddScore = document.getElementById('add-score-btn');
    if (btnAddScore) btnAddScore.style.display = 'none';

    const btnAddHouse = document.querySelector('button[onclick="openCreateHouse()"]');
    if (btnAddHouse) btnAddHouse.style.display = 'none';
    
    const btnRegras = document.querySelector('button[onclick*="regras.html"]');
    if (btnRegras) btnRegras.parentElement.style.display = 'none';
    
    const provasPendentes = document.getElementById('section-provas-pendentes');
    if (provasPendentes) provasPendentes.style.display = 'none';

    const btnFreq = document.querySelector('button[onclick="openAttendanceModal()"]');
    if (btnFreq) btnFreq.style.display = 'none';
  }
});
