let currentPatients = [];
let editingPatientId = null;
let currentTab = 'student'; // 'student' or 'team'

function switchTab(tab) {
  currentTab = tab;

  // Update UI
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tab === 'student' ? 'tab-students' : 'tab-team').classList.add('active');

  // Load data
  loadPatients();
}

async function loadPatients() {
  try {
    showLoading('patients-list', 'Carregando...');

    const search = document.getElementById('search-input')?.value || '';
    const activeOnly = document.getElementById('filter-active')?.checked;

    let url = '/api/patients';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (activeOnly) params.append('active', 'true');
    params.append('type', currentTab); // Add type param

    if (params.toString()) url += '?' + params.toString();

    const res = await fetch(url);
    if (!res.ok) {

      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar pacientes: ' + (errorData.error || res.status));
      return;
    }

    currentPatients = await res.json();
    renderPatients();
  } catch (err) {
    console.error(err);
    showError('Erro inesperado ao carregar pacientes');
  }
}

function renderPatients() {
  const list = document.getElementById('patients-list');
  list.innerHTML = '';

  if (!currentPatients.length) {
    list.innerHTML = '<li class="empty-state">Nenhum paciente encontrado</li>';
    return;
  }

  currentPatients.forEach(patient => {
    const li = document.createElement('li');
    li.className = 'patient-item';

    const info = document.createElement('div');
    info.className = 'patient-info';

    const name = document.createElement('div');
    name.className = 'patient-name';
    name.textContent = patient.name;

    const details = document.createElement('div');
    details.className = 'patient-details';

    if (patient.phone) {
      const phoneSpan = document.createElement('span');
      phoneSpan.textContent = `📞 ${patient.phone}`;
      details.appendChild(phoneSpan);
    }
    if (patient.cpf) {
      const cpfSpan = document.createElement('span');
      cpfSpan.textContent = `🆔 ${patient.cpf}`;
      details.appendChild(cpfSpan);
    }
    if (patient.email) {
      const emailSpan = document.createElement('span');
      emailSpan.textContent = `✉️ ${patient.email}`;
      details.appendChild(emailSpan);
    }
    if (!patient.active) {
      const inactiveSpan = document.createElement('span');
      inactiveSpan.textContent = '❌ Inativo';
      inactiveSpan.style.color = '#f44336';
      details.appendChild(inactiveSpan);
    }

    info.appendChild(name);
    info.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'patient-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Editar';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editPatient(patient.id);
    };

    actions.appendChild(editBtn);

    li.appendChild(info);
    li.appendChild(actions);
    li.onclick = () => viewPatient(patient.id);

    list.appendChild(li);
  });
}

function openNewPatient() {
  editingPatientId = null;
  document.getElementById('modal-patient-title').textContent = 'Novo Paciente';
  document.getElementById('form-patient').reset();
  document.getElementById('patient-id').value = '';
  loadHousesSelect(); // Chamando a nova função para carregar as casas
  document.getElementById('modal-patient').classList.remove('hidden');
}

function closePatientModal() {
  document.getElementById('modal-patient').classList.add('hidden');
  editingPatientId = null;
}

function editPatient(id) {
  editingPatientId = id;
  const patient = currentPatients.find(p => p.id === id);
  if (!patient) {
    showError('Paciente não encontrado');
    return;
  }

  document.getElementById('modal-patient-title').textContent = 'Editar Paciente';
  document.getElementById('patient-id').value = patient.id;
  document.getElementById('patient-name').value = patient.name || '';
  document.getElementById('patient-cpf').value = patient.cpf || '';
  document.getElementById('patient-phone').value = patient.phone || '';
  document.getElementById('patient-email').value = patient.email || '';
  document.getElementById('patient-birth_date').value = patient.birth_date || '';
  document.getElementById('patient-address').value = patient.address || '';
  document.getElementById('patient-city').value = patient.city || '';
  document.getElementById('patient-state').value = patient.state || '';
  document.getElementById('patient-zip_code').value = patient.zip_code || '';
  document.getElementById('patient-emergency_contact').value = patient.emergency_contact || '';
  document.getElementById('patient-emergency_phone').value = patient.emergency_phone || '';
  document.getElementById('patient-health_insurance').value = patient.health_insurance || '';
  document.getElementById('patient-health_insurance_number').value = patient.health_insurance_number || '';
  document.getElementById('patient-notes').value = patient.notes || '';

  document.getElementById('modal-patient').classList.remove('hidden');
}

function viewPatient(id) {
  editPatient(id);
}

function searchPatients() {
  loadPatients();
}

document.addEventListener('DOMContentLoaded', () => {
  loadPatients();

  const form = document.getElementById('form-patient');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const formData = new FormData(form);
    const patientId = formData.get('id');
    const data = {
      name: formData.get('name'),
      cpf: formData.get('cpf'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      birth_date: formData.get('birth_date'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip_code: formData.get('zip_code'),
      emergency_contact: formData.get('emergency_contact'),
      emergency_phone: formData.get('emergency_phone'),
      health_insurance: formData.get('health_insurance'),
      health_insurance_number: formData.get('health_insurance_number'),
      notes: formData.get('notes'),
      house_id: formData.get('house_id')
    };

    try {
      const url = patientId ? `/api/patients/${patientId}` : '/api/patients';
      const method = patientId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        showError('Erro ao salvar paciente: ' + (resData.error || res.status));
        setButtonLoading(submitBtn, false);
        return;
      }

      showSuccess(patientId ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
      closePatientModal();
      loadPatients();
      setButtonLoading(submitBtn, false);
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao salvar paciente');
      setButtonLoading(submitBtn, false);
    }
  });
});

async function loadHousesSelect() {
  try {
    const res = await fetch('/api/houses');
    const houses = await res.json();
    const select = document.getElementById('patient-house_id');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione a Casa...</option>';
    houses.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = h.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar casas para o select:", err);
  }
}



