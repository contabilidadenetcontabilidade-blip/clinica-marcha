const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed da Agenda...');
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    // 1. Fazer Login
    await page.goto('http://localhost:3000/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Ir para Agenda
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/agenda.html');
    await page.waitForTimeout(1000);

    // 3. Criar Agendamento
    await page.click('button:has-text("+ Novo Agendamento")');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });

    // Selecionar paciente (esperar carregar options)
    await page.waitForTimeout(1000);
    // Get first valid option
    const options = await page.$$eval('#appointment-patient_id option', opts => opts.map(o => o.value).filter(v => v));
    if (options.length > 0) {
        await page.selectOption('#appointment-patient_id', options[0]);
    }

    await page.fill('#appointment-title', 'Teste Data Correta');
    await page.fill('#appointment-date', '2026-03-05');
    await page.fill('#appointment-start_time', '10:00');
    await page.fill('#appointment-end_time', '11:00');

    await page.click('#form-appointment button[type="submit"]');

    // 4. Validar visualmente na semana
    await page.waitForTimeout(2000);
    await page.click('#btn-view-week');
    await page.waitForTimeout(2000);

    // Wait forever so CEO can see the result
    console.log('Verifique a interface visualmente! O card "Teste Data Correta" deve estar no dia 05/03.');
    await new Promise(() => { });

})();
