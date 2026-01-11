document.addEventListener('DOMContentLoaded', () => {
    loadProfessionals();

    const form = document.getElementById('form-professional');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        setButtonLoading(btn, true);

        const formData = new FormData(form);

        // We send as JSON because simple (no photo for now on this simple screen, or we could add it)
        // The previous patient form used FormData for photo. This simple one can use JSON or FormData. 
        // Backend accepts both? No, backend `uploadPatients.single` expects multipart if using that middleware.
        // Wait, if I use the SAME endpoint `/api/patients`, it parses `uploadPatients`.
        // If I send JSON to an endpoint with `multer`, it usually works for text fields if content-type is json? 
        // Multer normally handles multipart. 
        // Let's use FormData to be safe and consistent with backend expecting multipart for that route (even if empty file).

        try {
            const id = formData.get('id');
            const url = id ? `/api/patients/${id}` : '/api/patients';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData
            });

            if (!res.ok) throw new Error('Erro ao salvar');

            showSuccess('Profissional salvo!');
            closeModal();
            loadProfessionals();
        } catch (err) {
            console.error(err);
            showError('Erro ao salvar profissional');
        } finally {
            setButtonLoading(btn, false);
        }
    });
});

async function loadProfessionals() {
    const list = document.getElementById('professionals-list');
    list.innerHTML = 'Carregando...';

    try {
        const res = await fetch('/api/professionals'); // Fetches correctly filtered list
        // Backend now handles filtering.
        const fisios = await res.json();
        // const fisios = all.filter(p => p.role === 'fisio' || p.type === 'Fisioterapeuta'); // Filter by role (Backend does this now)

        list.innerHTML = '';
        if (fisios.length === 0) {
            list.innerHTML = '<li style="padding:20px;">Nenhum profissional encontrado.</li>';
            return;
        }

        fisios.forEach(p => {
            const li = document.createElement('li');
            li.className = 'patient-item';

            // Safer ID handling
            const safeId = typeof p.id === 'string' ? `'${p.id}'` : p.id;

            li.innerHTML = `
        <div class="patient-info">
          <div class="patient-name">🥼 ${p.name}</div>
          <div class="patient-details">
            <span>Login: ${p.email || '-'}</span>
          </div>
        </div>
        <div class="patient-actions">
           <button class="btn-edit" onclick="editProfessional(${safeId})">Editar</button>
        </div>
      `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = 'Erro ao carregar.';
    }
}

function openNewProfessional() {
    document.getElementById('form-professional').reset();
    document.getElementById('prof-id').value = '';
    document.getElementById('modal-title').textContent = 'Novo Profissional';

    // Reset button state in case it was stuck on 'Salvando...'
    const btn = document.querySelector('#form-professional button[type="submit"]');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }

    document.getElementById('modal-professional').classList.remove('hidden');
}

// Ensure global access
window.editProfessional = function (id) {
    console.log("Edit Professional clicked:", id);
    fetch(`/api/patients/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao buscar dados");
            return res.json();
        })
        .then(data => {
            console.log("Professional data loaded:", data);
            const modal = document.getElementById('modal-professional');
            if (modal) {
                document.getElementById('prof-id').value = data.id;
                document.getElementById('prof-name').value = data.name;
                document.getElementById('prof-email').value = data.email || '';
                document.getElementById('prof-password').value = '';
                document.getElementById('modal-title').textContent = 'Editar Profissional';
                modal.classList.remove('hidden');
            } else {
                console.error("Modal not found");
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

function closeModal() {
    document.getElementById('modal-professional').classList.add('hidden');
}

console.log('Script carregado com sucesso');
