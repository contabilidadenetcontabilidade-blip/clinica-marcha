// No changes here yet, checking backend first.
let currentView = 'day';
let currentDate = new Date();
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
  currentDate = new Date();
  loadAgenda();
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('pt-BR', options);
}

async function loadAgenda() {
  try {
    showLoading('agenda-view', 'Carregando agenda...');

    let url = '/api/appointments?';
    if (currentView === 'day') {
      url += `date=${formatDate(currentDate)}`;
      document.getElementById('current-date-display').textContent = formatDateDisplay(currentDate);
    } else {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      url += `start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
      document.getElementById('current-date-display').textContent =
        `Semana de ${formatDate(startDate)} a ${formatDate(endDate)}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar agenda: ' + (errorData.error || res.status));
      return;
    }

    currentAppointments = await res.json();
    renderAgenda();
  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar agenda');
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

// FIX DAY VIEW
function renderDayView() {
  const container = document.getElementById('agenda-view');
  const dayAppointments = currentAppointments.filter(apt =>
    (apt.appointment_date || '').split('T')[0] === formatDate(currentDate)
  );

  if (!dayAppointments.length) {
    container.innerHTML = '<div class="agenda-empty">Nenhum agendamento para este dia</div>';
    return;
  }
  // ... (rest of function omitted for brevity, logic continues)

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
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const grid = document.createElement('div');
  grid.className = 'agenda-week-view';

  // Header de horas
  const hourHeader = document.createElement('div');
  hourHeader.className = 'time-slot';
  grid.appendChild(hourHeader);

  // Headers dos dias
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const header = document.createElement('div');
    header.className = 'week-day-header';
    header.textContent = day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
    grid.appendChild(header);
  }

  // Colunas dos dias
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dayStr = formatDate(day);
    const isToday = formatDate(new Date()) === dayStr;

    const dayColumn = document.createElement('div');
    dayColumn.className = `week-day ${isToday ? 'week-day-today' : ''}`;

    // FIX WEEK VIEW COMPARISON
    const dayAppointments = currentAppointments.filter(apt =>
      (apt.appointment_date || '').split('T')[0] === dayStr
    );
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
  patient.style.display = 'flex';
  patient.style.alignItems = 'center';
  patient.style.gap = '8px';

  // Photo
  if (apt.patient_photo) {
    const img = document.createElement('img');
    img.src = apt.patient_photo;
    img.style.width = '30px';
    img.style.height = '30px';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    patient.appendChild(img);
  }

  // Name & WhatsApp
  const nameSpan = document.createElement('span');
  if (apt.patient_name && apt.patient_phone) {
    const rawPhone = apt.patient_phone.replace(/\D/g, '');
    const dateObj = new Date(apt.appointment_date);
    // Fix timezone offset issue manually or use string split for display date
    const dateStr = dateObj.toLocaleDateString('pt-BR');

    if (rawPhone) {
      const msg = encodeURIComponent(`Olá ${apt.patient_name.split(' ')[0]}, confirmamos sua aula de Pilates na Clínica Marcha em ${dateStr} às ${apt.start_time.substring(0, 5)}.`);
      nameSpan.innerHTML = `
            ${apt.patient_name} 
            <button class="btn-icon-wa" title="Confirmar no WhatsApp" onclick="event.stopPropagation(); window.open('https://wa.me/55${rawPhone}?text=${msg}', '_blank')">
                📱
            </button>
        `;
    } else {
      nameSpan.textContent = apt.patient_name;
    }
  } else {
    nameSpan.textContent = apt.patient_name || 'Sem paciente';
  }
  patient.appendChild(nameSpan);

  const status = document.createElement('div');
  status.style.display = 'flex';
  status.style.alignItems = 'center';
  status.style.gap = '5px';

  const statusSpan = document.createElement('span');
  statusSpan.className = `appointment-status status-${apt.status}`;
  statusSpan.textContent = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
  status.appendChild(statusSpan);

  // Botão Confirmar Presença
  if (apt.status === 'agendado') {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-mini-confirm';
    confirmBtn.innerHTML = '✅';
    confirmBtn.title = 'Confirmar Presença';
    confirmBtn.onclick = (e) => {
      e.stopPropagation();
      openConfirmModal(apt.id);
    };
    status.appendChild(confirmBtn);
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
    const select = document.getElementById('appointment-patient_id');
    select.innerHTML = '<option value="">Selecione um paciente</option>';
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

// ------------------------------------
// New Auto-Price Logic
// ------------------------------------
const SERVICE_PRICES = {
  'Pilates': 22.39,
  'Yoga': 16.92,
  'Treino Funcional': 14.61,
  'Fisioterapia': 100.00, // Defaul fallback
  'Liberação Miofascial': 80.00,
  'Condicionamento Físico': 30.00,
  'Avaliação': 0.00
};

function updateServicePrice() {
  const service = document.getElementById('appointment-service_type').value;
  const priceInput = document.getElementById('appointment-price');
  if (SERVICE_PRICES[service] !== undefined) {
    priceInput.value = SERVICE_PRICES[service].toFixed(2);
  }
}

// ------------------------------------
// Modal Logic Updates
// ------------------------------------
function openNewAppointment() {
  document.getElementById('modal-appointment-title').textContent = 'Novo Agendamento';
  document.getElementById('form-appointment').reset();
  document.getElementById('appointment-id').value = '';
  document.getElementById('appointment-date').value = formatDate(currentDate);
  document.getElementById('appointment-start_time').value = '08:00';

  // Default Recurrence
  document.getElementById('appointment-recurrence').value = 'none';

  // Trigger price update
  updateServicePrice();

  loadPatientsForSelect();
  document.getElementById('modal-appointment').classList.remove('hidden');
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
  // Title removed from UI, but kept in backend
  // document.getElementById('appointment-title').value = apt.title || '';
  document.getElementById('appointment-date').value = apt.appointment_date;
  document.getElementById('appointment-start_time').value = apt.start_time;
  document.getElementById('appointment-end_time').value = apt.end_time || '';
  document.getElementById('appointment-service_type').value = apt.service_type || 'Pilates';
  document.getElementById('appointment-price').value = apt.price || ''; // If backend sends price
  document.getElementById('appointment-professional').value = apt.professional || '';
  document.getElementById('appointment-status').value = apt.status || 'agendado';
  // document.getElementById('appointment-description').value = apt.description || '';
  document.getElementById('appointment-notes').value = apt.notes || '';
  document.getElementById('appointment-payment_method').value = apt.payment_method || '';

  // Recurrence logic (Simple check for now, backend usually handles creation of multiples)
  document.getElementById('appointment-recurrence').value = 'none';

  loadPatientsForSelect();
  updateServicePrice(); // Update based on service or keep fetched?
  // Ideally keep fetched if exists, else update
  // if(apt.price) document.getElementById('appointment-price').value = apt.price;

  setTimeout(() => {
    document.getElementById('appointment-patient_id').value = apt.patient_id;
  }, 100);

  document.getElementById('modal-appointment').classList.remove('hidden');
}

// ------------------------------------
// Form Submission Update
// ------------------------------------
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

    // Auto-generate Title
    const patientText = document.getElementById('appointment-patient_id').options[document.getElementById('appointment-patient_id').selectedIndex].text;
    const service = formData.get('service_type');
    const title = `${service} - ${patientText.split('(')[0].trim()}`;

    const data = {
      patient_id: parseInt(formData.get('patient_id'), 10),
      title: title,
      // description: formData.get('description'),
      appointment_date: formData.get('appointment_date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      service_type: service,
      price: parseFloat(formData.get('price')), // New field
      professional: formData.get('professional'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      recurrence: formData.get('recurrence') // 'none' or 'continuous'
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
        showError('Erro ao salvar: ' + (resData.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }

      showSuccess(appointmentId ? 'Atualizado!' : 'Criado com sucesso!');
      closeAppointmentModal();
      loadAgenda();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado');
      setButtonLoading(submitBtn, false);
    }
  });
});

// ------------------------------------
// Confirm Absence Logic
// ------------------------------------
async function confirmAbsence() {
  const id = document.getElementById('confirm-appt-id').value;
  if (!confirm("Marcar como 'Faltou'? Isso não gerará pontuação.")) return;

  try {
    const res = await fetch(`/api/appointments/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'faltou' }) // Send status override
    });
    const data = await res.json();
    if (data.success) {
      alert('Status atualizado para Faltou.');
      closeConfirmModal();
      loadAgenda();
    } else {
      alert('Erro: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
}

// Keep existing listener for Main Confirm Form (Attendance)
document.addEventListener('DOMContentLoaded', () => {
  const confirmForm = document.getElementById('form-confirm-presence');
  if (confirmForm) {
    confirmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('confirm-appt-id').value;
      const amount = document.getElementById('confirm-amount').value;
      const method = document.getElementById('confirm-payment-method').value;

      try {
        const res = await fetch(`/api/appointments/${id}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amount, payment_method: method, status: 'realizado' })
        });
        const data = await res.json();
        if (data.success) {
          alert('Presença confirmada e pontos lançados! 🏆');
          closeConfirmModal();
          loadAgenda();
        } else {
          alert('Erro: ' + (data.msg || data.error));
        }
      } catch (e) {
        console.error(e);
        alert('Erro de conexão');
      }
    });
  }
});



