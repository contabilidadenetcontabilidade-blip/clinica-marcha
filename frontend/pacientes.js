let currentPatients = [];
let editingPatientId = null;

async function loadPatients() {
  try {
    showLoading('patients-list', 'Carregando pacientes...');

    const search = document.getElementById('search-input')?.value || '';
    const activeOnly = document.getElementById('filter-active')?.checked;

    let url = '/api/patients';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (activeOnly) params.append('active', 'true');
    if (params.toString()) url += '?' + params.toString();

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showError('Erro ao carregar pacientes: ' + (errorData.error || res.status));
      return;
    }

    currentPatients = (await res.json()).filter(p => !p.role || p.role !== 'fisio');
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
    // Showing Type badge
    let typeBadge = '';
    if (patient.type) {
      let color = '#ccc';
      if (patient.type === 'Aluno') color = 'var(--accent)';
      if (patient.type === 'Paciente') color = 'var(--success)';
      if (patient.type === 'Cliente') color = 'var(--navy)';
      typeBadge = `<span style="background:${color}; color:white; font-size:0.7em; padding:2px 6px; border-radius:8px; margin-right:6px; vertical-align:middle;">${patient.type}</span>`;
    }
    name.innerHTML = `${typeBadge} ${patient.name}`;

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

function previewPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('patient-photo-preview').src = e.target.result;
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function openNewPatient() {
  editingPatientId = null;
  document.getElementById('modal-patient-title').textContent = 'Novo Cadastro - Clínica Marcha';
  document.getElementById('form-patient').reset();
  document.getElementById('patient-id').value = '';
  document.getElementById('patient-photo-preview').src = '../assets/default-user.png';
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

  document.getElementById('modal-patient-title').textContent = 'Editar - Clínica Marcha';
  document.getElementById('patient-id').value = patient.id;
  document.getElementById('patient-name').value = patient.name || '';
  document.getElementById('patient-type').value = patient.type || 'Paciente';
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

  if (patient.photo) {
    document.getElementById('patient-photo-preview').src = patient.photo;
  } else {
    document.getElementById('patient-photo-preview').src = '../assets/default-user.png';
  }

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

    // No need to convert to JSON, fetch accepts FormData directly and sets multipart/form-data

    try {
      const url = patientId ? `/api/patients/${patientId}` : '/api/patients';
      const method = patientId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData // Send FormData directly
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



