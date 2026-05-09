const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed em um banco Limpo para debugar Cancelar...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
        if (msg.type() === 'error') {
            console.error(`❌ Erro no frontend: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        console.error(`❌ PAGE ERROR: ${error.message}`);
    });

    // 1. Fazer Login
    await page.goto('http://localhost:3000/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Ir para Agenda
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/agenda.html');
    await page.waitForTimeout(500);

    // 3. Criar Agendamento
    await page.click('button:has-text("+ Novo Agendamento")');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });

    await page.waitForTimeout(500);
    const options = await page.$$eval('#appointment-patient_id option', opts => opts.map(o => o.value).filter(v => v));
    if (options.length > 0) {
        await page.selectOption('#appointment-patient_id', options[0]);
    }

    await page.fill('#appointment-title', 'Teste Cancelamento Bug');
    await page.fill('#appointment-date', '2026-03-04');
    await page.fill('#appointment-start_time', '12:00');
    await page.fill('#appointment-end_time', '13:00');

    await page.click('#form-appointment button[type="submit"]');
    await page.waitForTimeout(1000);

    // 4. Mudar para a Visão Semanal
    await page.click('#btn-view-week'); // garante view semana
    await page.waitForTimeout(1000);

    // 5. Clicar no Agendamento Recém-Criado
    console.log('Abrindo agendamento para cancelar...');
    await page.click('text=Teste Cancelamento Bug');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });
    await page.waitForTimeout(1000);

    // 6. Clicar em Cancelar e Aceitar o Confirm
    page.once('dialog', dialog => {
        console.log(`Mensagem de confirmação: ${dialog.message()}`);
        dialog.accept();
    });
    console.log('Clicando no botão de cancelar...');
    await page.click('#btn-cancel-appointment');

    await page.waitForTimeout(2000); // aguarda processamento

    console.log('Teste concluído.');
    await browser.close();

})();
