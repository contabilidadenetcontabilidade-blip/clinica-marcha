const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed Visão Semanal 21h...');
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

    // 3. Criar Agendamento às 21:00 para o Dia 04/03/2026
    await page.click('button:has-text("+ Novo Agendamento")');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });

    await page.waitForTimeout(500);
    const options = await page.$$eval('#appointment-patient_id option', opts => opts.map(o => o.value).filter(v => v));
    if (options.length > 0) {
        await page.selectOption('#appointment-patient_id', options[0]);
    }

    await page.fill('#appointment-title', 'Teste Data Correta Dia 4 - 21h00');
    await page.fill('#appointment-date', '2026-03-04'); // DIA 04 DA SEMANA
    await page.fill('#appointment-start_time', '21:00');
    await page.fill('#appointment-end_time', '22:00');

    await page.click('#form-appointment button[type="submit"]');
    await page.waitForTimeout(1000);

    // 4. Mudar para a Visão Semanal
    await page.click('#btn-view-week'); // garante view semana
    await page.waitForTimeout(1000);

    // 5. Clicar em Cancelar
    console.log('Abrindo agendamento para cancelar...');
    await page.click('text=Teste Data Correta Dia 4 - 21h00');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });
    await page.waitForTimeout(500);

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-cancel-appointment');

    // Mantém aberto
    console.log('Verifique se "Teste Data Correta Dia 4 - 21h00" está na quarta-feira (4), sem ter recuado para terça-feira, e cancelado com sucesso.');
    await new Promise(() => { });

})();
