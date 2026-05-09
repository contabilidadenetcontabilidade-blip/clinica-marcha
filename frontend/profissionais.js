document.addEventListener('DOMContentLoaded', () => {
    loadProfessionals();

    const form = document.getElementById('form-professional');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        setButtonLoading(btn, true);

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            registration_number: formData.get('registration_number'),
            color: formData.get('color')
        };

        try {
            const id = formData.get('id');
            const url = id ? `/api/professionals/${id}` : '/api/professionals';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || 'Erro ao salvar');
            }

            showSuccess('Profissional salvo!');
            closeModal();
            loadProfessionals();
        } catch (err) {
            console.error(err);
            showError(`Erro ao salvar: ${err.message}`);
        } finally {
            setButtonLoading(btn, false);
        }
    });

    const modalFooter = document.querySelector('.form-actions');
    if (modalFooter && !document.getElementById('btn-delete-pro')) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.id = 'btn-delete-pro';
        delBtn.textContent = '🗑️ Excluir';
        delBtn.className = 'btn-secondary';
        delBtn.style.background = '#d32f2f';
        delBtn.style.color = 'white';
        delBtn.style.borderColor = '#d32f2f';
        delBtn.style.display = 'none';
        delBtn.onclick = deleteProfessionalAction;
        modalFooter.appendChild(delBtn);
    }
});

async function deleteProfessionalAction() {
    const id = document.getElementById('prof-id').value;
    if (!id) return;
    if (!confirm("Excluir este profissional definitivamente?")) return;

    try {
        const res = await fetch(`/api/professionals/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showSuccess("Profissional desativado com sucesso.");
            closeModal();
            loadProfessionals();
        } else {
            showError("Erro ao excluir profissional.");
        }
    } catch (e) {
        showError("Erro de conexão.");
    }
}

async function loadProfessionals() {
    const list = document.getElementById('professionals-list');
    list.innerHTML = 'Carregando...';

    try {
        const res = await fetch('/api/professionals');
        if (!res.ok) throw new Error('Falha na busca da API');
        const pros = await res.json();

        list.innerHTML = '';
        if (pros.length === 0) {
            list.innerHTML = '<li style="padding:20px;">Nenhum profissional cadastrado.</li>';
            return;
        }

        pros.forEach(p => {
            const li = document.createElement('li');
            li.className = 'patient-item';
            li.style.borderLeft = `5px solid ${p.color || '#2196F3'}`;

            li.innerHTML = `
        <div class="patient-info">
          <div class="patient-name">🥼 ${p.name}</div>
          <div class="patient-details">
            <span>Especialidade: ${p.specialty || '-'}</span>
            <span style="margin-left: 15px;">Registro: ${p.registration_number || 'N/A'}</span>
          </div>
        </div>
        <div class="patient-actions">
           <button class="btn-edit" onclick="editProfessional(${p.id})">Editar</button>
        </div>
      `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = 'Erro ao carregar profissionais.';
    }
}

function openNewProfessional() {
    document.getElementById('form-professional').reset();
    document.getElementById('prof-id').value = '';
    // Cor padrão
    document.getElementById('prof-color').value = '#2196F3';

    document.getElementById('modal-title').textContent = 'Novo Profissional';

    const btn = document.querySelector('#form-professional button[type="submit"]');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }

    const del = document.getElementById('btn-delete-pro');
    if (del) del.style.display = 'none';

    document.getElementById('modal-professional').classList.remove('hidden');
}

window.editProfessional = function (id) {
    fetch(`/api/professionals/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao buscar dados");
            return res.json();
        })
        .then(data => {
            const modal = document.getElementById('modal-professional');
            if (modal) {
                document.getElementById('prof-id').value = data.id;
                document.getElementById('prof-name').value = data.name;
                document.getElementById('prof-specialty').value = data.specialty || 'Fisioterapia';
                document.getElementById('prof-registration').value = data.registration_number || '';
                document.getElementById('prof-color').value = data.color || '#2196F3';

                document.getElementById('modal-title').textContent = 'Editar Profissional';

                const del = document.getElementById('btn-delete-pro');
                if (del) del.style.display = 'inline-block';

                modal.classList.remove('hidden');
            }
        })
        .catch(err => {
            console.error(err);
            showError("Erro ao carregar dados para edição.");
        });
};

function closeModal() {
    document.getElementById('modal-professional').classList.add('hidden');
}
