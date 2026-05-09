(function () {
    // 1. Verifica login
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // Se não logado e não é login page, tchau
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // 2. Verifica Role e Acesso
    const user = JSON.parse(userStr);
    const path = window.location.pathname.toLowerCase();

    const isProfessional = (user.role === 'admin' || user.role === 'fisio');
    const isAdmin = (user.role === 'admin' || user.is_admin === 1);

    // Se é Aluno/Paciente tentando acessar áreas restritas
    if (!isProfessional) {
        // Páginas bloqueadas para alunos
        const restricted = ['index.html', 'agenda.html', 'financeiro.html', 'pacientes.html', 'profissionais.html'];

        // Verifica se a página atual é restrita (precisa match exato ou parcial se for root)
        const isRestricted = restricted.some(p => path.endsWith(p) || (path.endsWith('/') && p === 'index.html'));

        if (isRestricted) {
            console.warn('Acesso negado: Aluno tentando acessar área profissional.');
            window.location.href = 'portal_aluno.html';
            return;
        }
    }

    // Se é Profissional NÃO ADMIN tentando acessar o financeiro
    if (path.includes('financeiro.html') && !isAdmin) {
        alert('Acesso restrito ao Administrador.');
        window.location.href = 'agenda.html';
        return;
    }

    // Ocultar menu Financeiro e Profissionais da Navbar Global para Fisios
    window.addEventListener('DOMContentLoaded', () => {
        // Exibe o nome do usuário logado
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && user.name) {
            const userGreeting = document.createElement('span');
            userGreeting.style.color = '#FFD700';
            userGreeting.style.fontWeight = 'bold';
            userGreeting.style.marginRight = '15px';
            userGreeting.style.fontSize = '0.9rem';
            userGreeting.innerHTML = `Olá, ${user.name}`;
            navLinks.prepend(userGreeting);
        }

        if (!isAdmin) {
            const financeiroLinks = document.querySelectorAll('a[href*="financeiro.html"]');
            financeiroLinks.forEach(link => {
                link.style.display = 'none';
            });

            const profissionaisLinks = document.querySelectorAll('a[href*="profissionais.html"]');
            profissionaisLinks.forEach(link => {
                link.style.display = 'none';
            });
        }
    });

})();
