document.addEventListener("DOMContentLoaded", async () => {

  // 1. Fetch Dashboard Stats
  try {
    const user = JSON.parse(localStorage.getItem('user'));

    // UI Hiding (Security Rule)
    if (user && user.role !== 'admin') {
      // Hide Faturamento Card
      const revCard = document.getElementById('dashboard-total-revenue').closest('.card');
      if (revCard) revCard.style.display = 'none';

      // Hide Finance Chart
      const finChart = document.getElementById('financePieChart').closest('.card');
      if (finChart) finChart.style.display = 'none';
    }

    const res = await fetch('/api/dashboard', {
      headers: { 'X-User-Role': user ? user.role : 'guest' }
    });

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    // Update Cards
    if (user && user.role === 'admin') {
      document.getElementById('dashboard-total-revenue').textContent = formatCurrency(data.income);
      renderFinanceChart(data.income, data.expenses);
    }

    document.getElementById('dashboard-active-patients').textContent = data.activePatients;
    document.getElementById('dashboard-cup-leader').textContent = data.leader ? data.leader.name : '-';

    // Render Charts
    renderAppointmentsChart(data.appointments);

  } catch (e) {
    console.error("Dashboard Load Error:", e);
  }

  // 2. Fetch Ranking for List
  loadRankingList();
});

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function renderFinanceChart(income, expenses) {
  const ctx = document.getElementById('financePieChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ['#4caf50', '#f44336'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderAppointmentsChart(appointments) {
  const ctx = document.getElementById('appointmentsBarChart').getContext('2d');

  // Process data
  const labels = appointments.map(a => a.service_type);
  const data = appointments.map(a => a.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Agendamentos',
        data: data,
        backgroundColor: '#0f1a2a',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

async function loadRankingList() {
  try {
    // Assuming /api/ranking exists based on previous file state
    // If not, we might need to rely on /api/houses or similar.
    // Let's try /api/ranking first.
    const res = await fetch('/api/ranking');
    // Fallback if 404
    if (res.status === 404) {
      // Try alternate or Mock
      document.getElementById('ranking-container').innerHTML = 'Ranking não disponível.';
      return;
    }
    const ranking = await res.json();

    const container = document.getElementById('ranking-container');
    container.innerHTML = '';

    if (ranking.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666;">Nenhuma casa ativa</div>';
    } else {
      ranking.slice(0, 5).forEach((house, index) => { // Top 5
        const div = document.createElement('div');
        div.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee;`;

        let medal = '';
        if (index === 0) medal = '🥇';
        if (index === 1) medal = '🥈';
        if (index === 2) medal = '🥉';

        div.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; width: 20px;">${medal || (index + 1)}</span>
                <span style="font-weight: 500; color: #333;">${house.name}</span>
              </div>
              <div style="font-weight: 700; color: var(--navy);">${house.total_points} pts</div>
           `;
        container.appendChild(div);
      });
    }

  } catch (err) {
    console.error('Erro ranking list:', err);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
