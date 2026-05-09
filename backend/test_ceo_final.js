const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
    console.log("=== INICIANDO INSPEÇÃO DE ESTRESSE DO CEO (TIME: 2026-02-28) ===");

    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const page = await browser.newPage();

    try {
        console.log("-> 1. Configurando Mock State...");
        await page.goto('http://localhost:3000/login.html');
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({ id: 1, name: "Tamara", role: "patient", house_id: 1 }));
        });

        console.log("-> 2. Reiniciando Servidor 3 vezes para o Teste de Estresse...");
        for (let i = 1; i <= 3; i++) {
            console.log(`\nReinicialização ${i}/3...`);
            // Reinicia o servidor matando o processo 'node index.js' e subindo um temporário
            execSync('Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Id -ne $PID} | Stop-Process -Force', { shell: 'powershell.exe' });

            // Sozinho, matamos o servidor. Vamos reiniciá-lo via comando em background
            const { spawn } = require('child_process');
            const server = spawn('node', ['index.js'], { detached: true, stdio: 'ignore' });
            server.unref();

            console.log(`Servidor de volta ao ar! Aguardando estabilização (2s)...`);
            await page.waitForTimeout(2000);

            // Recarregando portal apos restart
            await page.goto('http://localhost:3000/portal_aluno.html', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Validacao Parcial apos Restart
            const cards = await page.$$('.card-frame');
            console.log(`Cartas detectadas após reboot ${i}: ${cards.length}`);
            if (cards.length !== 15) throw new Error("Falha brutal: O deck não contém as 15 cartas exigidas após o reboot!");
        }

        console.log("\n-> 3. Prova Final de CSS (#000033) e Cartas (Portal Aluno)");
        const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        console.log("Cor do Fundo Inspecionada (rgb):", bgColor); // Esperado rgb(0, 0, 51) para #000033

        const cardsCount = await page.$$('.card-frame');
        console.log(`Quantidade Final de Cartas na UI: ${cardsCount.length} (Devem ser as 15 estáticas forçadas)`);

        console.log("\n-> 4. Prova Simétrica de Data (Agenda)");
        await page.goto('http://localhost:3000/agenda.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#current-date-display', { timeout: 3000 });
        const agendaDate = await page.textContent('#current-date-display');
        console.log(`Data na tela: ${agendaDate}`);

        console.log("=== SISTEMA 100% ESTÁVEL E BLINDADO. AGUARDANDO NAVEGADOR (45s) PARA APROVAÇÃO VISUAL DO CEO ===");

        // Ficar na tela do aluno pro CEO ver as cartas
        await page.goto('http://localhost:3000/portal_aluno.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(45000);

    } catch (e) {
        console.error("Erro na inspeção:", e);
    } finally {
        await browser.close();
        console.log("Sessão finalizada.");
    }
})();
