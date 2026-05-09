document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    let username = usernameInput.value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const btn = document.querySelector('.btn-login');

    errorMsg.textContent = '';
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Erro no login');
        }

        // Success
        localStorage.setItem('currentUser', JSON.stringify(data));
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('patient_id', data.id);
        localStorage.setItem('is_admin', data.role === 'admin' ? 'true' : 'false');
        localStorage.setItem('role', data.role || 'atleta');
        console.log("Login Success:", data);

        // Redirect Logic
        if (data.role === 'admin' || data.role === 'fisio') {
            window.location.href = 'index.html'; // Profissionais -> Dashboard Completo
        } else {
            window.location.href = 'portal_aluno.html'; // Alunos/Pacientes -> Portal
        }


    } catch (err) {
        console.error(err);
        errorMsg.textContent = err.message;
        btn.textContent = 'ACESSAR';
        btn.disabled = false;
    }
});