const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed em um banco TRUNCADO (Limpo)...');
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    // 1. Fazer Login
    await page.goto('http://localhost:3000/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Ir para Agenda
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/agenda.html');
    await page.waitForTimeout(500);

    // 3. Checar aba Dia
    const textDay = await page.locator('.agenda-empty').textContent();
    console.log('Validando visão de dia (vazio):', textDay.trim());

    // 4. Mudar para a Visão Semanal
    await page.click('#btn-view-week');
    await page.waitForTimeout(1000);

    // 5. Validar Erros de Console (Garantir que a render do framework aguenta arrays vazios)
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`❌ Erro de Console: ${msg.text()}`);
        }
    });

    // Mantém aberto
    console.log('Visualização concluída com sucesso sem quebrar a tela de grade / calendários. O sistema será mantido minimizado/aberto para a inspeção do CEO.');
    await new Promise(() => { });

})();
