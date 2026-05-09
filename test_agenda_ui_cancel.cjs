const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed da Agenda - Teste de Cancelamento...');
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

    // 3. Criar Agendamento para o Dia 4
    await page.click('button:has-text("+ Novo Agendamento")');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });

    await page.waitForTimeout(1000);
    const options = await page.$$eval('#appointment-patient_id option', opts => opts.map(o => o.value).filter(v => v));
    if (options.length > 0) {
        await page.selectOption('#appointment-patient_id', options[0]);
    }

    await page.fill('#appointment-title', 'Teste Data Correta Dia 4 Cancelar');
    await page.fill('#appointment-date', '2026-03-04'); // DIA 04 DA SEMANA
    await page.fill('#appointment-start_time', '16:00');
    await page.fill('#appointment-end_time', '17:00');

    await page.click('#form-appointment button[type="submit"]');
    await page.waitForTimeout(1000);

    // 4. Mudar para a Visão Semanal
    await page.click('#btn-view-week'); // garante view semana
    await page.waitForTimeout(2000);

    // 5. Clicar no Agendamento Recém-Criado
    console.log('Abrindo agendamento para cancelar...');
    await page.click('text=Teste Data Correta Dia 4 Cancelar');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });
    await page.waitForTimeout(1000);

    // 6. Clicar em Cancelar e Aceitar o Confirm
    page.once('dialog', dialog => {
        console.log(`Mensagem de confirmação: ${dialog.message()}`);
        dialog.accept();
    });
    await page.click('#btn-cancel-appointment');

    // Mantém processo aberto para o CEO
    console.log('Verifique a interface visualmente! O card "Teste Data Correta Dia 4 Cancelar" deve estar no dia 04/03 (Quarta-feira) e deve estar com estilo de Cancelado (riscado e cinza).');
    await new Promise(() => { });

})();
