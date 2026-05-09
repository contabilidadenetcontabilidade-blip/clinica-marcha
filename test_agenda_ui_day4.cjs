const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed da Agenda - Teste Dia 4...');
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
    const options = await page.$$eval('#appointment-patient_id option', opts => opts.map(o => o.value).filter(v => v));
    if (options.length > 0) {
        await page.selectOption('#appointment-patient_id', options[0]);
    }

    await page.fill('#appointment-title', 'Teste Data Correta Dia 4');
    await page.fill('#appointment-date', '2026-03-04'); // DIA 04 DA SEMANA
    await page.fill('#appointment-start_time', '14:00');
    await page.fill('#appointment-end_time', '15:00');

    await page.click('#form-appointment button[type="submit"]');
    await page.waitForTimeout(1000); // aguarda o toast

    // 4. Validar visualmente na semana
    await page.waitForTimeout(1000);
    await page.click('#btn-view-week'); // garante view semana
    await page.waitForTimeout(2000);

    // 5. Validar a Data na Edição
    console.log('Clicando no agendamento para validar data de edição...');
    await page.click('text=Teste Data Correta Dia 4');
    await page.waitForSelector('#modal-appointment', { state: 'visible' });
    await page.waitForTimeout(2000); // aguarda carregar modal

    const modalDateValue = await page.inputValue('#appointment-date');
    console.log(`Valor do input data na edição: ${modalDateValue}`);

    if (modalDateValue === '2026-03-04') {
        console.log('SUCESSO: A data no modal de edição permaneceu exata - 2026-03-04.');
    } else {
        console.log(`FALHA: A data no modal de edição mudou para ${modalDateValue}.`);
    }

    // Mantém processo aberto para o CEO
    console.log('Verifique a interface visualmente! O card "Teste Data Correta Dia 4" deve estar no dia 04/03 (Quarta-feira). E o form de edição também deve exibir 04/03.');
    await new Promise(() => { });

})();
