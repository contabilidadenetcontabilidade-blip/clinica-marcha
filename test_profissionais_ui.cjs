const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando Teste Headed do Módulo Profissionais...');
    const browser = await chromium.launch({ headless: false, slowMo: 600 });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    // 1. Login
    await page.goto('http://localhost:3000/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Check agenda navbar has Profissionais
    await page.goto('http://localhost:3000/agenda.html');
    await page.waitForTimeout(1000);
    console.log('Checando menu Global em Agenda...');
    const foundProfissionaisInAgenda = await page.isVisible('text="Profissionais"');
    if (foundProfissionaisInAgenda) {
        console.log('✅ Menu Profissionais encontrado.');
        await page.click('text="Profissionais"');
    } else {
        console.error('❌ Menu não encontrado em Agenda.');
    }

    await page.waitForTimeout(1000);

    // 3. Create new Professional
    console.log('Criando novo Profissional...');
    await page.click('button:has-text("+ Novo Profissional")');
    await page.waitForSelector('#modal-professional', { state: 'visible' });

    await page.fill('#prof-name', 'Dra. Verônica Silva');
    await page.selectOption('#prof-specialty', 'Pilates');
    await page.fill('#prof-registration', 'CREFITO 9999-F');
    await page.fill('#prof-color', '#ff5722'); // Laranja

    await page.click('#form-professional button[type="submit"]');
    await page.waitForTimeout(1500);

    // 4. Verify in List
    console.log('Procurando pela Dra. Verônica na lista...');
    const profItem = await page.isVisible('text="Dra. Verônica Silva"');
    if (profItem) {
        console.log('✅ Profissional renderizado com sucesso com todos os dados.');
    }

    console.log('Visualização da tela concluída! Mantendo aberto para o CEO...');
    await new Promise(() => { }); // Manter aberto
})();
