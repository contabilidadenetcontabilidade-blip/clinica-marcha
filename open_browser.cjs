const { chromium } = require('playwright');

(async () => {
    console.log('Iniciando automação com Playwright...');
    // Initialize headed browser
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });
    const context = await browser.newContext({
        viewport: null
    });
    const page = await context.newPage();

    console.log('Navegando para http://localhost:3000');
    await page.goto('http://localhost:3000');

    console.log('Página carregada. Mantendo o navegador aberto para inspeção.');
    // Keep the process running indefinitely so the CEO can see it
    await new Promise(() => { });
})();
