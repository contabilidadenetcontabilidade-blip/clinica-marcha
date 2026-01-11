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
        img.onerror = function () { // Fallback if image fails
          this.onerror = null;
          this.src = '../assets/logo_marcha.png'; // Or empty
          this.style.background = h.color || '#192C46';
        };
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
