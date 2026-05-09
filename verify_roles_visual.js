const puppeteer = require('puppeteer');

(async () => {
    console.log("🔥 PROVA DE FOGO: Teste de Perfis (Profissional vs Aluno) 🔥");

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // ============================================
    // TESTE 1: PROFISSIONAL (ADMIN)
    // ============================================
    console.log("\n🧪 1. Testando Acesso PROFISSIONAL (Admin)...");

    // 1.1 Tentar acessar home direta (deve redirecionar se não logado, ou permitir se localStorage persistiu - vamos limpar antes)
    await page.goto('http://localhost:3000/login.html');
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:3000/');
    // Confirma redirecionamento para login
    if (page.url().includes('login.html')) {
        console.log("✅ Redirecionou para Login corretamente (Auth Guard Ativo).");
    } else {
        console.error("❌ FALHA: Acessou home sem login! URL:", page.url());
        process.exit(1);
    }

    // 1.2 Login
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.click('.btn-login');

    await page.waitForNavigation();

    // 1.3 Verificar Destino (Index)
    if (page.url().includes('index.html')) {
        console.log("✅ Login Profissional: Redirecionado para Dashboard (Index).");
    } else {
        console.error("❌ FALHA: Profissional não foi para Index. URL:", page.url());
    }

    // 1.4 Verificar Menu Completo (Agenda, Pacientes, Financeiro)
    const menuButtons = await page.$$('.menu button');
    if (menuButtons.length >= 3) {
        console.log(`✅ Menu Profissional visível (${menuButtons.length} botões).`);
    } else {
        console.error("❌ FALHA: Menu Profissional incompleto.");
    }

    // 1.5 Verificar Botão Novo Agendamento (Simulado navegação para agenda)
    await page.goto('http://localhost:3000/agenda.html');
    const btnNew = await page.$('button[onclick="openNewAppointment()"]');
    if (btnNew) {
        console.log("✅ Botão 'Novo Agendamento' encontrado na Agenda.");
    } else {
        console.error("❌ FALHA: Botão 'Novo Agendamento' sumiu.");
    }

    // Logout
    await page.evaluate(() => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
    await page.waitForNavigation();
    console.log("✅ Logout Profissional realizado.");

    // ============================================
    // TESTE 2: ALUNO
    // ============================================
    console.log("\n🧪 2. Testando Acesso ALUNO...");

    // 2.1 Login
    await page.type('#username', 'aluno');
    await page.type('#password', 'aluno123');
    await page.click('.btn-login');

    await page.waitForNavigation();

    // 2.2 Verificar Destino (Portal)
    if (page.url().includes('portal_aluno.html')) {
        console.log("✅ Login Aluno: Redirecionado para Portal do Aluno.");
    } else {
        console.error("❌ FALHA: Aluno não foi para Portal. URL:", page.url());
    }

    // 2.3 Tentar acessar Agenda (Deve ser bloqueado)
    await page.goto('http://localhost:3000/agenda.html');
    // Wait a bit for redirect
    await new Promise(r => setTimeout(r, 1000));

    if (page.url().includes('portal_aluno.html')) {
        console.log("✅ Bloqueio de Rota: Aluno chutado da Agenda de volta para Portal.");
    } else if (page.url().includes('agenda.html')) {
        console.error("❌ FALHA CRÍTICA: Aluno conseguiu acessar Agenda!");
    }

    // 2.4 Verificar Ranking e Brasões no Portal (ou página de Ranking)
    // O aluno pode ir para o ranking via FAB
    await page.goto('http://localhost:3000/ranking.html');

    // Esperar carregar casas
    await page.waitForSelector('.house-card');
    const houses = await page.$$('.house-card');
    console.log(`✅ Ranking Aluno: ${houses.length} casas carregadas.`);

    // Verificar imagens (src não vazio e não placeholder se possível)
    const crests = await page.$$eval('.house-card img.crest', imgs => imgs.map(img => img.src));
    const validCrests = crests.filter(src => !src.includes('placeholder') && src.includes('assets/img/Brasoes')); // Ajuste conforme path real

    // Nota: O path real pode ser /assets/img/Brasoes/Joseph.png etc, ou /assets/houses se uploaded.
    // O seed script usou /assets/img/Brasoes/...
    const pilatesThemes = crests.some(src => src.toLowerCase().includes('joseph') || src.toLowerCase().includes('cadilac'));

    if (pilatesThemes) {
        console.log("✅ Tema Pilates detectado nos brasões (Joseph/Cadilac...).");
    } else {
        console.log("⚠️ Aviso: Verifique visualmente os brasões. URLs encontradas:", crests);
    }

    console.log("\n🎉 PROVA DE FOGO CONCLUÍDA. Verifique a janela do navegador se necessário. Fechando em 10s...");
    await new Promise(r => setTimeout(r, 10000));

    await browser.close();

})();
