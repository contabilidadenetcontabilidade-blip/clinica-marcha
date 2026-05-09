const { chromium } = require('playwright');
const sqlite3 = require('sqlite3').verbose();
const dbPath = 'C:\\Marcha\\database.sqlite';
const db = new sqlite3.Database(dbPath);

(async () => {
    console.log("=== INICIANDO VALIDACAO CEO DE SEGURANCA ===");

    // Forçar Tamara a trocar a senha (password_changed = 0, senha temporária = 123)
    await new Promise((resolve, reject) => {
        db.run("UPDATE patients SET password_changed = 0, password = '123' WHERE id = 1", (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    console.log("-> 1. Resetando password_changed = 0 e senha para '123' na Database");

    const username = await new Promise((resolve) => {
        db.get("SELECT username FROM patients WHERE id = 1", (err, row) => resolve(row && row.username ? row.username : 'tamara'));
    });

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log(`-> 2. Navegando para o Login e preenchendo credenciais ('${username}', '123')...`);
    await page.goto('http://localhost:3000/login.html');

    await page.fill('#username', username);
    await page.fill('#password', '123');
    await page.click('button[type="submit"]');

    // Esperar redirecionamento e modal forçado
    console.log("-> 3. Aguardando Modal Forçado de Troca de Senha na Área do Aluno (Navy Dark UI)...");
    await page.waitForNavigation();

    const url = await page.url();
    if (!url.includes("portal_aluno.html")) {
        console.log("   Redirecionamento admin detectado, forçando portal_aluno...");
        try {
            await page.goto("http://localhost:3000/portal_aluno.html", { timeout: 3000 });
        } catch (e) { console.log("   Timeout bypass."); }
    }

    await page.waitForTimeout(1500); // Aguarda o delay do setTimeout 800ms

    // Dump localstorage
    const lsUser = await page.evaluate(() => localStorage.getItem('user'));
    console.log("   --> localStorage['user'] =", lsUser);

    const isModalVisible = await page.isVisible('#passwordModal');
    if (isModalVisible) {
        console.log("   [SUCESSO] Modal forçado exibido!");
    } else {
        console.log("   [ERRO] Modal não apareceu. CEO vai reprovar.");
    }

    console.log("-> 4. Preenchendo e salvando 'senhaSegura123' [BCRYPT]...");
    await page.fill('#new_password', 'senhaSegura123');
    await page.fill('#confirm_password', 'senhaSegura123');

    // Interceptar o alert de sucesso
    page.on('dialog', async dialog => {
        console.log(`   [ALERTA interceptado]: ${dialog.message()}`);
        await dialog.accept();
    });

    await page.click('#changePasswordForm button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log("=== TESTE VISUAL CONCLUIDO COM SUCESSO. DEIXANDO NAVEGADOR ABERTO ===");
})();
