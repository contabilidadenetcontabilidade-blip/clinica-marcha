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
      option.textContent = p.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar pacientes:', err);
  }
}

function openNewAppointment() {
  document.getElementById('modal-appointment-title').textContent = 'Novo Agendamento';
  document.getElementById('form-appointment').reset();
  document.getElementById('appointment-id').value = '';
  document.getElementById('appointment-date').value = formatDate(currentDate);
  loadPatientsForSelect();
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
  document.getElementById('appointment-professional').value = apt.professional || '';
  document.getElementById('appointment-status').value = apt.status || 'agendado';
  document.getElementById('appointment-description').value = apt.description || '';
  document.getElementById('appointment-notes').value = apt.notes || '';
  
  loadPatientsForSelect();
  setTimeout(() => {
    document.getElementById('appointment-patient_id').value = apt.patient_id;
  }, 100);
  
  document.getElementById('modal-appointment').classList.remove('hidden');
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
      notes: formData.get('notes')
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



