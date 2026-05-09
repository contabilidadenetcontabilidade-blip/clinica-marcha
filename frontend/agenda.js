const getTodayDate = () => {
  return new Date();
};

let currentView = 'day';
let currentDate = getTodayDate();

// Mapa de valores padrão por convênio
const INSURANCE_VALUES = {
  'Particular': 150.00,
  'Gympass': 22.20,
  'TotalPass': 22.00,
  'ClassPass': 22.00,
  'Outro': 120.00
};
let allPatients = [];
let currentAppointments = [];

function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-view-${view}`).classList.add('active');
  loadAgenda();
}

function previousWeek() {
  currentDate.setDate(currentDate.getDate() - 7);
  loadAgenda();
}

function nextWeek() {
  currentDate.setDate(currentDate.getDate() + 7);
  loadAgenda();
}

function today() {
  currentDate = getTodayDate();
  loadAgenda();
}

function formatDate(date) {
  // Retorna a data em yyyy-mm-dd para a query
  // Resolve bug de fuso horário (evita rollback em data string)
  let d = date;
  if (typeof date === 'string') {
    d = new Date(date.includes('T') ? date : date + 'T00:00:00');
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(date) {
  let d = date;
  if (typeof date === 'string') {
    d = new Date(date.includes('T') ? date : date + 'T00:00:00');
  }
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('pt-BR', options);
}

async function loadAgenda() {
  try {
    showLoading('agenda-view', 'Carregando agenda...');

    let url = '/api/appointments?';
    if (currentView === 'day') {
      url += `date=${formatDate(currentDate)}`;
      document.getElementById('current-date-display').textContent = formatDateDisplay(currentDate);
    } else {
      // Cálculo seguro de semana evitando timezone slip
      const curr = new Date(currentDate.getTime());
      const first = curr.getDate() - curr.getDay();
      const startDate = new Date(curr.setDate(first));
      const endDate = new Date(curr.setDate(curr.getDate() + 6));
      url += `start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
      document.getElementById('current-date-display').textContent =
        `Semana de ${formatDateDisplay(startDate)} a ${formatDateDisplay(endDate)}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar agenda: ' + (errorData.error || res.status));
      return;
    }

    currentAppointments = await res.json();
    renderAgenda();

    // Alerta sutil se houver reposições
    checkPendingMakeupsQuietly();

  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar agenda');
  }
}

async function checkPendingMakeupsQuietly() {
  try {
    const res = await fetch('/api/appointments/pending-makeups');
    if (res.ok) {
      const makeups = await res.json();
      if (makeups.length > 0) {
        // Could light up a badge on the button
      }
    }
  } catch (e) { console.error('Silent fetch failed', e); }
}

async function loadPendingMakeups() {
  try {
    showLoading('agenda-view', 'Buscando reposições pendentes...');
    const res = await fetch('/api/appointments/pending-makeups');
    if (!res.ok) throw new Error('Falha ao buscar reposições.');
    const makeups = await res.json();

    const banner = document.getElementById('makeup-banner');
    const list = document.getElementById('makeup-list');
    list.innerHTML = '';

    if (makeups.length === 0) {
      list.innerHTML = '<div style="color:#666; font-size:0.9rem;">Nenhuma aula de reposição pendente no momento.</div>';
    } else {
      makeups.forEach(m => {
        const d = new Date(m.appointment_date + 'T00:00:00');
        const formattedDate = d.toLocaleDateString('pt-BR');
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.7); padding:10px; border-radius:4px; border:1px solid #FFCC80;';
        div.innerHTML = `
          <div>
            <strong style="color:#E65100;">${m.patient_name || 'Paciente Desconhecido'}</strong> 
            <span style="color:#555; font-size:0.9rem;">- Falta em ${formattedDate} (${m.title})</span>
          </div>
          <button onclick="resolveMakeup(${m.id})" style="background:#FF9800; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;">Dar Baixa</button>
        `;
        list.appendChild(div);
      });
    }

    // Restaura a visualização da agenda e mostra a lista
    renderAgenda();
    banner.style.display = 'block';

  } catch (err) {
    showError('Erro ao buscar reposições pendentes');
    renderAgenda();
  }
}

async function resolveMakeup(id) {
  if (!confirm('Deseja dar baixa nesta reposição? (Isto indica que a aula foi reposta ou o aluno perdeu o direito)')) return;
  try {
    const res = await fetch(`/api/appointments/${id}/resolve-makeup`, { method: 'PUT' });
    if (!res.ok) throw new Error('Erro ao baixar.');
    showSuccess('Reposição baixada com sucesso.');
    loadPendingMakeups();
  } catch (e) {
    showError(e.message);
  }
}

function renderAgenda() {
  const container = document.getElementById('agenda-view');
  container.innerHTML = '';

  if (currentView === 'day') {
    renderDayView();
  } else {
    renderWeekView();
  }
}

function renderDayView() {
  const container = document.getElementById('agenda-view');
  const dayAppointments = currentAppointments.filter(apt =>
    apt.appointment_date === formatDate(currentDate)
  );

  if (!dayAppointments.length) {
    container.innerHTML = '<div class="agenda-empty">Nenhum agendamento para este dia</div>';
    return;
  }

  dayAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time));

  const grid = document.createElement('div');
  grid.className = 'agenda-day-view';

  const timesColumn = document.createElement('div');
  timesColumn.className = 'time-column';

  const appointmentsColumn = document.createElement('div');
  appointmentsColumn.className = 'appointments-column';

  dayAppointments.forEach(apt => {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = apt.start_time.substring(0, 5);

    const aptItem = createAppointmentItem(apt);

    timesColumn.appendChild(timeSlot);
    appointmentsColumn.appendChild(aptItem);
  });

  grid.appendChild(timesColumn);
  grid.appendChild(appointmentsColumn);
  container.appendChild(grid);
}

function renderWeekView() {
  const container = document.getElementById('agenda-view');

  // Cálculo seguro do início da semana baseado no currentDate exato
  const curr = new Date(currentDate.getTime());
  const first = curr.getDate() - curr.getDay();
  const weekStart = new Date(curr.setDate(first));

  const grid = document.createElement('div');
  grid.className = 'agenda-week-view';

  // Header de horas
  const hourHeader = document.createElement('div');
  hourHeader.className = 'time-slot';
  grid.appendChild(hourHeader);

  // Headers dos dias
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart.getTime());
    day.setDate(weekStart.getDate() + i);
    const header = document.createElement('div');
    header.className = 'week-day-header';
    header.textContent = day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
    grid.appendChild(header);
  }

  // Espaçador para a coluna de horas (para alinhar a grade)
  const timeColumnPlaceholder = document.createElement('div');
  timeColumnPlaceholder.className = 'time-column';
  grid.appendChild(timeColumnPlaceholder);

  // Colunas dos dias
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart.getTime());
    day.setDate(weekStart.getDate() + i);
    const dayStr = formatDate(day);
    const isToday = formatDate(getTodayDate()) === dayStr;

    const dayColumn = document.createElement('div');
    dayColumn.className = `week-day ${isToday ? 'week-day-today' : ''}`;

    const dayAppointments = currentAppointments.filter(apt => apt.appointment_date === dayStr);
    dayAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time));

    dayAppointments.forEach(apt => {
      dayColumn.appendChild(createAppointmentItem(apt));
    });

    grid.appendChild(dayColumn);
  }

  container.appendChild(grid);
}

function createAppointmentItem(apt) {
  const item = document.createElement('div');
  item.className = 'appointment-item';
  item.onclick = () => editAppointment(apt.id);

  const time = document.createElement('div');
  time.className = 'appointment-time';
  time.textContent = `${apt.start_time.substring(0, 5)}${apt.end_time ? ' - ' + apt.end_time.substring(0, 5) : ''}`;

  const title = document.createElement('div');
  title.className = 'appointment-title';
  title.textContent = apt.title;

  const patient = document.createElement('div');
  patient.className = 'appointment-patient';
  patient.textContent = apt.patient_name || 'Sem paciente';

  const status = document.createElement('span');
  status.className = `appointment-status status-${apt.status}`;
  status.textContent = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);

  if (apt.status === 'cancelado') {
    item.style.backgroundColor = '#f1f1f1';
    item.style.color = '#9e9e9e';
    item.style.borderLeftColor = '#9e9e9e';
    title.style.textDecoration = 'line-through';
    time.style.textDecoration = 'line-through';
    status.style.backgroundColor = '#e0e0e0';
    status.style.color = '#757575';
  }

  item.appendChild(time);
  item.appendChild(title);
  item.appendChild(patient);
  item.appendChild(status);

  return item;
}

async function loadPatientsForSelect() {
  try {
    const res = await fetch('/api/patients?active=true');
    if (!res.ok) return [];
    const patients = await res.json();
    allPatients = patients; // Armazena para consulta de convênio
    const select = document.getElementById('appointment-patient_id');
    select.innerHTML = '<option value="">Selecione um paciente</option>';
    patients.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
    // Ao trocar de paciente, sugere o valor do convênio
    select.onchange = () => suggestProcedureValue(select.value);
  } catch (err) {
    console.error('Erro ao carregar pacientes:', err);
  }
}

function suggestProcedureValue(patientId) {
  const field = document.getElementById('appointment-procedure_value');
  if (!field || !patientId) return;
  const patient = allPatients.find(p => String(p.id) === String(patientId));
  if (patient && patient.health_insurance && INSURANCE_VALUES[patient.health_insurance] !== undefined) {
    field.value = INSURANCE_VALUES[patient.health_insurance].toFixed(2);
  } else if (patient && patient.health_insurance) {
    field.value = INSURANCE_VALUES['Outro'] ? INSURANCE_VALUES['Outro'].toFixed(2) : '0.00';
  } else {
    field.value = '';
  }
}

async function loadProfessionalsForSelect(selectedValue = '') {
  try {
    const res = await fetch('/api/professionals');
    const container = document.getElementById('professional-container');
    if (!res.ok) throw new Error('Falha HTTP');
    const professionals = await res.json();

    // Create select
    const select = document.createElement('select');
    select.id = 'appointment-professional';
    select.name = 'professional';
    select.innerHTML = '<option value="">Nenhum específico</option>';

    professionals.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name; // Binding by Name to match legacy records
      option.textContent = p.name;
      select.appendChild(option);
    });

    container.innerHTML = '<label>Profissional</label>';
    container.appendChild(select);

    if (selectedValue) {
      select.value = selectedValue;
    }
  } catch (err) {
    console.warn('Fallback ativado para Profissionais:', err.message);
    const container = document.getElementById('professional-container');
    container.innerHTML = `<label>Profissional</label><input type="text" id="appointment-professional" name="professional" placeholder="Livre..." value="${selectedValue || ''}">`;
  }
}

function openNewAppointment() {
  document.getElementById('modal-appointment-title').textContent = 'Novo Agendamento';
  document.getElementById('form-appointment').reset();
  document.getElementById('appointment-id').value = '';
  document.getElementById('appointment-date').value = formatDate(currentDate);
  loadPatientsForSelect();
  loadProfessionalsForSelect();
  document.getElementById('btn-cancel-appointment').style.display = 'none'; // Esconde botão ao criar novo
  document.getElementById('modal-appointment').classList.remove('hidden');
}

function closeAppointmentModal() {
  document.getElementById('modal-appointment').classList.add('hidden');
}

function editAppointment(id) {
  const apt = currentAppointments.find(a => a.id === id);
  if (!apt) {
    showError('Agendamento não encontrado');
    return;
  }

  document.getElementById('modal-appointment-title').textContent = 'Editar Agendamento';
  document.getElementById('appointment-id').value = apt.id;
  document.getElementById('appointment-patient_id').value = apt.patient_id;
  document.getElementById('appointment-title').value = apt.title || '';
  document.getElementById('appointment-date').value = apt.appointment_date;
  document.getElementById('appointment-start_time').value = apt.start_time;
  document.getElementById('appointment-end_time').value = apt.end_time || '';
  document.getElementById('appointment-service_type').value = apt.service_type || 'Consulta';
  document.getElementById('appointment-status').value = apt.status || 'agendado';
  document.getElementById('appointment-procedure_value').value = apt.procedure_value || '';
  document.getElementById('appointment-description').value = apt.description || '';
  document.getElementById('appointment-notes').value = apt.notes || '';

  loadPatientsForSelect();
  loadProfessionalsForSelect(apt.professional || '');

  setTimeout(() => {
    document.getElementById('appointment-patient_id').value = apt.patient_id;
  }, 100);

  // Mostra botão de cancelar apenas se não estiver cancelado
  const btnCancel = document.getElementById('btn-cancel-appointment');
  if (apt.status !== 'cancelado') {
    btnCancel.style.display = 'inline-block';
  } else {
    btnCancel.style.display = 'none';
  }

  document.getElementById('modal-appointment').classList.remove('hidden');
}

async function cancelAppointment() {
  try {
    const id = document.getElementById('appointment-id').value;
    if (!id) {
      showError('Nenhum ID de agendamento selecionado na tela.');
      return;
    }

    if (!confirm('Deseja realmente cancelar este agendamento?')) {
      return;
    }

    // Use original appointment to prevent accidental date or data override
    const apt = currentAppointments.find(a => String(a.id) === String(id));
    if (!apt) {
      showError(`Erro ao localizar o agendamento original (ID ${id}) na memória do painel.`);
      return;
    }

    const btnCancel = document.getElementById('btn-cancel-appointment');
    setButtonLoading(btnCancel, true, 'Cancelando...');

    const payload = {
      ...apt,
      status: 'cancelado' // Força apenas o status cancelado, mantém todo o resto (a data do agendado, horario, etc)
    };

    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      showError(`Erro ao cancelar agendamento: ${errorJson.error || res.status}`);
      setButtonLoading(btnCancel, false, 'Cancelar Agendamento');
      return;
    }

    showSuccess('Agendamento cancelado com sucesso!');
    closeAppointmentModal();
    loadAgenda();
  } catch (err) {
    console.error('CRITICAL CANCEL ERROR:', err);
    showError(`Erro crítico no cancelamento: ${err.message}`);
  } finally {
    const btnCancel = document.getElementById('btn-cancel-appointment');
    if (btnCancel) setButtonLoading(btnCancel, false, 'Cancelar Agendamento');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAgenda();
  loadPatientsForSelect();

  const form = document.getElementById('form-appointment');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const formData = new FormData(form);
    const appointmentId = formData.get('id');
    const data = {
      patient_id: parseInt(formData.get('patient_id'), 10),
      title: formData.get('title'),
      description: formData.get('description'),
      appointment_date: formData.get('appointment_date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      service_type: formData.get('service_type'),
      professional: formData.get('professional'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      procedure_value: parseFloat(formData.get('procedure_value')) || 0
    };

    try {
      const url = appointmentId ? `/api/appointments/${appointmentId}` : '/api/appointments';
      const method = appointmentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        showError('Erro ao salvar agendamento: ' + (resData.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }

      showSuccess(appointmentId ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!');
      closeAppointmentModal();
      loadAgenda();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao salvar agendamento');
      setButtonLoading(submitBtn, false);
    }
  });
});



