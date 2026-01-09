document.addEventListener("DOMContentLoaded", async () => {
    const agendaList = document.getElementById("agenda-list");
    const btnCup = document.getElementById("btn-cup");
  
    // Carregar agenda de hoje
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/appointments?date=${today}&status=agendado,confirmado`);
      if (res.ok) {
        const appointments = await res.json();
        agendaList.innerHTML = '';
        if (appointments.length === 0) {
          const li = document.createElement("li");
          li.textContent = "Nenhum agendamento para hoje";
          agendaList.appendChild(li);
        } else {
          appointments.slice(0, 5).forEach(apt => {
            const li = document.createElement("li");
            li.style.cssText = "padding: 12px 16px; margin-bottom: 8px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 10px; border-left: 4px solid var(--accent); transition: all 0.3s ease;";
            li.innerHTML = `<strong>${apt.start_time.substring(0, 5)}</strong> — ${apt.patient_name || apt.title} — <span style="color: #666;">${apt.service_type || 'Consulta'}</span>`;
            li.onmouseenter = function() { this.style.transform = 'translateX(4px)'; this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; };
            li.onmouseleave = function() { this.style.transform = 'translateX(0)'; this.style.boxShadow = 'none'; };
            agendaList.appendChild(li);
          });
          if (appointments.length > 5) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="agenda.html" style="color: var(--navy); text-decoration: underline;">Ver mais ${appointments.length - 5} agendamentos...</a>`;
            agendaList.appendChild(li);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
      agendaList.innerHTML = '<li>Erro ao carregar agenda</li>';
    }

    // Carregar resumo financeiro do dia
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/financial/summary?start_date=${today}&end_date=${today}`);
      if (res.ok) {
        const summary = await res.json();
        const financeiroSection = document.querySelector('.financeiro');
        if (financeiroSection) {
          const previstoDisplay = document.getElementById('previsto-display');
          const recebidoDisplay = document.getElementById('recebido-display');
          if (previstoDisplay) {
            previstoDisplay.textContent = formatCurrency(summary.receitas.total);
          }
          if (recebidoDisplay) {
            recebidoDisplay.textContent = formatCurrency(summary.receitas.paid);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    }
  
    btnCup.addEventListener("click", () => {
        window.location.href = "cup.html";
      });
      
  });

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
  