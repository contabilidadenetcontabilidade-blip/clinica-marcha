const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando DIAGNÓSTICO VISUAL DE EMERGÊNCIA...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 150,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        const targetUrl = 'http://localhost:3000/login.html';
        console.log(`🌐 Navegando para ${targetUrl}...`);

        const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

        if (!response) {
            console.error('❌ Falha: Não houve resposta do servidor (Página não carregou).');
            return;
        }

        const status = response.status();
        console.log(`📡 Status HTTP: ${status}`);

        if (status !== 200) {
            console.error(`❌ ERRO HTTP ${status}: O arquivo não foi encontrado ou houve erro no servidor.`);
            // console.log('Conteúdo:', await page.content());
            return;
        }

        // Tenta identificar onde estamos
        const title = await page.title();
        console.log(`📄 Título da Página: "${title}"`);

        // Procura campos de login
        try {
            await page.waitForSelector('input#username', { timeout: 5000 });
            console.log('✅ Campo de usuário ENCONTRADO!');

            await page.type('input#username', 'glaubert');
            await page.type('input#password', 'marcha2026');

            const loginBtn = await page.$('button[type="submit"]') || await page.$('button.btn-login');
            if (loginBtn) {
                console.log('✅ Botão de login encontrado. Clicando...');

                // Clica e espera a promessa de navegação ou tempo
                await loginBtn.click();

                console.log('🔄 Login enviado. Aguardando redirecionamento...');

                try {
                    // Espera mudança de URL ou aparecimento do body da nova página
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
                    console.log('✅ Navegação concluída!');
                } catch (e) {
                    console.log('⚠️ Timeout na navegação. Verificando URL atual...');
                }

                const currentUrl = page.url();
                console.log(`📍 URL Final: ${currentUrl}`);

                if (currentUrl.includes('login.html')) {
                    console.error('❌ Login falhou ou não redirecionou (ainda em login.html).');
                    const errorMsg = await page.$eval('#error-msg', el => el.textContent);
                    console.log(`Mensagem de erro na tela: "${errorMsg}"`);
                } else {
                    console.log('🎉 SUCESSO: Login realizado! Redirecionado para dashboard.');
                    await page.screenshot({ path: 'local_verify_success.png' });
                }
            }

        } catch (e) {
            console.error('❌ ERRO: Campos de login não apareceram na tela.');
            console.log('URL atual:', page.url());
            const body = await page.evaluate(() => document.body.innerText.substring(0, 200));
            console.log('Início do texto da página:', body);
        }

        console.log('⏳ Mantendo navegador aberto por 2 minutos para análise visual...');
        console.log('⚠️ SE A TELA ESTIVER BRANCA: Verifique se o index.js está servindo a pasta correta.');
        await new Promise(r => setTimeout(r, 120000));

    } catch (error) {
        console.error('❌ CRASH NO SCRIPT:', error.message);
    } finally {
        console.log('Fechando navegador...');
        await browser.close();
    }
})();
