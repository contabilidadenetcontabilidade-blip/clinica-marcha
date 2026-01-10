document.addEventListener("DOMContentLoaded", async () => {
    const user = checkAuth();
    if (!user) return; // checkAuth redirects

    document.getElementById('user-display').textContent = user.name;
    document.getElementById('welcome-msg').textContent = `Olá, ${user.name.split(' ')[0]}!`;

    try {
        const res = await fetch(`/api/student-portal/${user.id}`);
        if (!res.ok) throw new Error('Erro ao carregar dados');
        const data = await res.json();

        renderHouseCard(data);
        renderHistory(data.scores);
        renderRankingChart(data.ranking, data.house?.name);

    } catch (err) {
        console.error(err);
        document.getElementById('house-card').innerHTML = '<p>Erro ao carregar dados. Contate a recepção.</p>';
    }
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(userStr);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function renderHouseCard(data) {
    const container = document.getElementById('house-card');
    const { house, athlete } = data;

    if (!house || !athlete) {
        container.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h3>Você ainda não foi sorteado para uma casa! 🎩</h3>
        <p>Aguarde a cerimônia do Chapéu Seletor.</p>
      </div>
    `;
        return;
    }

    // Set nice gradient border or background
    container.style.borderTop = `5px solid ${house.color}`;

    container.innerHTML = `
    <img src="${house.crest}" alt="${house.name}" class="house-crest-large">
    <div class="house-name" style="color: ${house.color}">${house.name}</div>
    <div>
      <span class="my-points">${athlete.totalScore}</span>
      <span class="points-label">Pontos Pessoais</span>
    </div>
  `;
}

function renderHistory(scores) {
    const list = document.getElementById('score-history');
    list.innerHTML = '';

    if (!scores || scores.length === 0) {
        list.innerHTML = '<li style="padding:15px; text-align:center; color:#999;">Nenhuma pontuação ainda... Bora treinar! 💪</li>';
        return;
    }

    scores.forEach(s => {
        const li = document.createElement('li');
        li.className = 'score-item';
        li.innerHTML = `
      <span class="score-rule">${s.rule_name}</span>
      <span class="score-value">+${s.value}</span>
    `;
        list.appendChild(li);
    });
}

function renderRankingChart(ranking, myHouseName) {
    const ctx = document.getElementById('rankingChart').getContext('2d');

    const labels = ranking.map(h => h.name);
    const data = ranking.map(h => h.total_points);
    const colors = ranking.map(h => h.name === myHouseName ? '#FFD700' : '#e0e0e0'); // Highlight my house with Gold, others Grey

    // Or stick to house colors? Maybe confusing. Let's use house colors but highlight border.
    // Actually, using the 'color' from API would be best but simple logic:
    // Let's rely on standard colors or basic palette. 
    // For 'My House vs Others' visual:

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pontos Totais',
                data: data,
                backgroundColor: ranking.map(h => h.name === myHouseName ? '#4caf50' : '#90a4ae'),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
