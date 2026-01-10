document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    let username = usernameInput.value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const btn = document.querySelector('.btn-login');

    // Basic cleanup for CPF if user typed special chars (though placeholder says only numbers)
    // If it looks like a CPF (11 digit-ish), strip non-digits.
    // Actually, let's just strip non-digits if it seems to be numeric-intent to match stored plain numbers?
    // But username/email are also allowed. 
    // If it contains '@' it's email. If it contains letters, it's username. 
    // If it's only digits/dots/dashes, likely CPF.

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
        localStorage.setItem('user', JSON.stringify(data));
        console.log("Login Success:", data);

        // Redirect Logic
        if (data.role === 'admin') {
            window.location.href = 'index.html';
        } else if (data.role === 'fisio') {
            window.location.href = 'agenda.html'; // Fisioterapeuta -> Agenda
        } else {
            // Aluno or others
            window.location.href = 'portal_aluno.html';
        }

    } catch (err) {
        console.error(err);
        errorMsg.textContent = err.message;
        btn.textContent = 'ACESSAR';
        btn.disabled = false;
    }
});
