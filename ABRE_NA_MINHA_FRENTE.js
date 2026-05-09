const puppeteer = require('puppeteer');

(async () => {
    console.log('🤖 AGENTE: Executando no SEU Windows...');

    // Tenta encontrar o Chrome do Windows (caminhos comuns)
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    console.log(`🔎 Usando Chrome em: ${executablePath}`);

    try {
        const browser = await puppeteer.launch({
            headless: false, // VISÍVEL NA TELA
            slowMo: 150,     // Câmera lenta
            defaultViewport: null,
            executablePath: executablePath, // Tenta usar o Chrome instalado
            args: ['--start-maximized']
        });

        const page = await browser.newPage();

        // 1. Acessa Login
        console.log('🌐 Abrindo http://localhost:3000/login.html');
        await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle0' });

        // 2. Preenche Formulário
        console.log('✍️ Preenchendo glaubert / marcha2026');
        await page.type('#username', 'glaubert');
        await page.type('#password', 'marcha2026');

        // 3. Clica em Entrar
        console.log('🖱️ Clicando em ENTRAR...');

        const loginBtn = await page.$('button[type="submit"]');
        if (loginBtn) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }), // Espera navegar
                loginBtn.click()
            ]);
            console.log('✅ Login clicado e navegação concluída!');
        } else {
            console.error('❌ Botão de login não encontrado!');
        }

        console.log('🎉 SUCESSO! O navegador ficará aberto por 10 minutos para você ver.');

        // Mantém aberto por 10 minutos
        await new Promise(r => setTimeout(r, 600000));

        await browser.close();

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        if (error.message.includes('Browser is not downloaded') || error.message.includes('executablePath')) {
            console.log('\n⚠️ DICA: Se o Chrome não estiver em C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe, edite este script com o caminho correto ou remova a linha executablePath para usar o Chromium embutido.');
        }
    }
})();
