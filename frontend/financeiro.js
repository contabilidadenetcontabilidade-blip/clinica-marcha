let currentTransactions = [];
let currentSummary = null;

async function loadSummary() {
  try {
    const startDate = document.getElementById('filter-start-date')?.value || '';
    const endDate = document.getElementById('filter-end-date')?.value || '';

    let url = '/api/financial/summary';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error('Erro ao carregar resumo');
      return;
    }

    currentSummary = await res.json();
    renderSummary();
  } catch (err) {
    console.error('Erro ao carregar resumo:', err);
  }
}

function renderSummary() {
  if (!currentSummary) return;

  // Total Recebido = Receitas Pagas
  document.getElementById('total-recebido').textContent =
    formatCurrency(currentSummary.receitas.paid);

  // Total Pendente = Receitas Totais - Receitas Pagas
  const pending = currentSummary.receitas.total - currentSummary.receitas.paid;
  document.getElementById('total-pendente').textContent =
    formatCurrency(pending);

  // Saldo Esperado = Receitas Totais - Despesas Totais (Balance)
  document.getElementById('saldo-esperado').textContent =
    formatCurrency(currentSummary.balance);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

async function loadTransactions() {
  try {
    showLoading('transactions-list', 'Carregando transações...');

    const type = document.getElementById('filter-type')?.value || '';
    const startDate = document.getElementById('filter-start-date')?.value || '';
    const endDate = document.getElementById('filter-end-date')?.value || '';

    let url = '/api/financial?';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += params.toString();

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar transações: ' + (errorData.error || res.status));
      return;
    }

    currentTransactions = await res.json();
    renderTransactions();
    loadSummary();
  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar transações');
  }
}

function renderTransactions() {
  const list = document.getElementById('transactions-list');
  list.innerHTML = '';

  if (!currentTransactions.length) {
    list.innerHTML = '<li class="empty-state">Nenhuma transação encontrada</li>';
    return;
  }

  currentTransactions.forEach(transaction => {
    const li = document.createElement('li');
    li.className = `transaction-item ${transaction.type}`;

    const info = document.createElement('div');
    info.className = 'transaction-info';

    const desc = document.createElement('div');
    desc.className = 'transaction-description';
    desc.textContent = transaction.description;

    const details = document.createElement('div');
    details.className = 'transaction-details';

    if (transaction.category) {
      const catSpan = document.createElement('span');
      catSpan.textContent = `📁 ${transaction.category}`;
      details.appendChild(catSpan);
    }
    if (transaction.patient_name) {
      const patientSpan = document.createElement('span');
      patientSpan.textContent = `👤 ${transaction.patient_name}`; // Backend will be updated to include type if needed, or we just show name.
      details.appendChild(patientSpan);
    }
    if (transaction.due_date) {
      const dueSpan = document.createElement('span');
      dueSpan.textContent = `📅 Venc: ${formatDate(transaction.due_date)}`;
      details.appendChild(dueSpan);
    }
    if (transaction.payment_date) {
      const paidSpan = document.createElement('span');
      paidSpan.textContent = `✅ Pago: ${formatDate(transaction.payment_date)}`;
      paidSpan.style.color = '#4caf50';
      details.appendChild(paidSpan);
    }

    info.appendChild(desc);
    info.appendChild(details);

    const amount = document.createElement('div');
    amount.className = `transaction-amount ${transaction.type}`;
    amount.textContent = formatCurrency(transaction.amount);

    li.appendChild(info);
    li.appendChild(amount);
    li.onclick = () => editTransaction(transaction.id);

    list.appendChild(li);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

async function loadPatientsForSelect() {
  try {
    const res = await fetch('/api/patients?active=true');
    if (!res.ok) return;
    const patients = await res.json();
    const select = document.getElementById('transaction-patient_id');
    select.innerHTML = '<option value="">Nenhum</option>';
    patients.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} (${p.type || 'Pessoa'})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar pacientes:', err);
  }
}

function openNewTransaction(type) {
  document.getElementById('modal-transaction-title').textContent =
    type === 'receita' ? 'Nova Receita - Clínica Marcha' : 'Nova Despesa - Clínica Marcha';
  document.getElementById('form-transaction').reset();
  document.getElementById('transaction-id').value = '';
  document.getElementById('transaction-type-select').value = type;
  document.getElementById('transaction-type').value = type;
  loadPatientsForSelect();

  // Set today as default due date
  document.getElementById('transaction-due_date').value = new Date().toISOString().split('T')[0];

  document.getElementById('modal-transaction').classList.remove('hidden');
}

function closeTransactionModal() {
  document.getElementById('modal-transaction').classList.add('hidden');
}

function editTransaction(id) {
  const transaction = currentTransactions.find(t => t.id === id);
  if (!transaction) {
    showError('Transação não encontrada');
    return;
  }

  document.getElementById('modal-transaction-title').textContent = 'Editar Transação';
  document.getElementById('transaction-id').value = transaction.id;
  document.getElementById('transaction-type-select').value = transaction.type;
  document.getElementById('transaction-type').value = transaction.type;
  document.getElementById('transaction-description').value = transaction.description || '';
  document.getElementById('transaction-category').value = transaction.category || '';
  document.getElementById('transaction-amount').value = transaction.amount || '';
  document.getElementById('transaction-due_date').value = transaction.due_date || '';
  document.getElementById('transaction-payment_date').value = transaction.payment_date || '';
  document.getElementById('transaction-payment_method').value = transaction.payment_method || '';
  document.getElementById('transaction-notes').value = transaction.notes || '';

  loadPatientsForSelect();
  setTimeout(() => {
    document.getElementById('transaction-patient_id').value = transaction.patient_id || '';
  }, 100);

  document.getElementById('modal-transaction').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Set default date range (current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  document.getElementById('filter-start-date').value = firstDay.toISOString().split('T')[0];
  document.getElementById('filter-end-date').value = lastDay.toISOString().split('T')[0];

  loadTransactions();
  loadPatientsForSelect();

  document.getElementById('transaction-type-select').addEventListener('change', (e) => {
    document.getElementById('transaction-type').value = e.target.value;
  });

  const form = document.getElementById('form-transaction');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const formData = new FormData(form);
    const transactionId = formData.get('id');
    const data = {
      type: formData.get('type'),
      category: formData.get('category'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      due_date: formData.get('due_date'),
      payment_date: formData.get('payment_date'),
      payment_method: formData.get('payment_method'),
      patient_id: formData.get('patient_id') || null,
      notes: formData.get('notes')
    };

    try {
      const url = transactionId ? `/api/financial/${transactionId}` : '/api/financial';
      const method = transactionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        showError('Erro ao salvar transação: ' + (resData.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }

      showSuccess(transactionId ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!');
      closeTransactionModal();
      loadTransactions();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao salvar transação');
      setButtonLoading(submitBtn, false);
    }
  });
});




// -------------- PDF Export Logic --------------

async function exportFinancialReportPDF() {
  alert("Iniciando geração de PDF..."); // Debug 1

  // Tenta acessar jsPDF de todas as formas possíveis
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    alert("Erro Crítico: jspdf não encontrado. Verifique sua conexão com a internet.");
    return;
  }

  const doc = new jsPDF();
  alert("Documento criado. Adicionando conteúdo..."); // Debug 2
  const dateStr = new Date().toLocaleDateString('pt-BR');

  // 1. Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Relatório Financeiro - Clínica Marcha", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data de Emissão: ${dateStr}`, 14, 28);

  let startY = 35;

  // 1.5 Generate and Add Chart
  if (currentSummary && typeof Chart !== 'undefined') {
    try {
      // Create temp canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);

      const income = currentSummary.receitas.paid || 0;
      const expenseVal = currentSummary.despesas ? currentSummary.despesas.total : 0;

      const chartData = {
        labels: ['Receitas', 'Despesas'],
        datasets: [{
          data: [income, expenseVal],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      };

      const chartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: {
          animation: false,
          responsive: false,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 15, startY, 80, 40);

      // Add some info next to chart
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text("Gráfico: Receitas vs Despesas do Período", 100, startY + 20);

      chartInstance.destroy();
      document.body.removeChild(canvas);
      startY += 45;

    } catch (e) {
      console.error("Erro gerando gráfico PDF:", e);
    }
  }

  // 2. Summary Section
  if (currentSummary) {
    doc.setFillColor(240, 240, 240);
    doc.rect(14, startY, 182, 25, 'F');

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo do Período", 18, startY + 8);

    doc.setFontSize(10);
    doc.text(`Total Recebido: ${formatCurrency(currentSummary.receitas.paid)}`, 18, startY + 18);
    doc.text(`Pendente: ${formatCurrency(currentSummary.receitas.total - currentSummary.receitas.paid)}`, 80, startY + 18);
    doc.text(`Saldo Esperado: ${formatCurrency(currentSummary.balance)}`, 140, startY + 18);

    startY += 30;
  }

  // 3. Transactions Table
  const tableColumn = ["Data", "Descrição", "Categ.", "Cliente/Aluno", "Valor", "Status"];
  const tableRows = [];

  if (currentTransactions) {
    currentTransactions.forEach(t => {
      const date = formatDate(t.due_date);
      const amount = formatCurrency(t.amount);
      const status = t.payment_date ? "Pago" : "Pendente";
      const patient = t.patient_name || "-";

      tableRows.push([
        date,
        t.description,
        t.category || "",
        patient,
        amount,
        status
      ]);
    });
  }

  if (doc.autoTable) {
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  } else {
    console.warn("Plugin autoTable não encontrado. Tabela será ignorada.");
    doc.text("Erro: Plugin de tabela não carregado.", 14, startY + 10);
  }

  // 4. Save (Direto no Browser)
  const filename = 'Relatorio_Financeiro_Marcha.pdf';
  try {
    doc.save(filename);
  } catch (e) {
    console.error("Erro ao salvar PDF:", e);
    alert("Erro ao salvar PDF.");
  }
}

console.log('Script carregado com sucesso');
