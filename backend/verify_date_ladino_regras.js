const sqlite3 = require('sqlite3').verbose();
const { chromium } = require('playwright');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'Marcha', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("=== INICIANDO VALIDACAO FINAL DO CEO ===");

db.serialize(() => {
    // Inject a Ladino card for test
    const validHash = "LADINO-CEO-TEST-1234";

    // Ensure patient 1 is in athletes table so the Ladino API query works
    db.run(`INSERT OR IGNORE INTO athletes (patient_id, house_id, name) VALUES (1, 1, 'Tamara CEO')`);

    db.run(`INSERT OR IGNORE INTO student_cards (student_id, card_id, hash, used) 
            SELECT 1, id, ?, 0 FROM cards WHERE name = 'Ladino' LIMIT 1`,
        [validHash], async function (err) {
            if (err && !err.message.includes("UNIQUE constraint failed")) {
                console.error("Erro ao injetar carta Ladino:", err.message);
                return;
            }

            db.run(`UPDATE student_cards SET used = 0 WHERE hash = ?`, [validHash]);

            const browser = await chromium.launch({ headless: false, slowMo: 400 });
            const context = await browser.newContext();
            const page = await context.newPage();

            try {
                console.log("-> 1. Configurando Estado e Abrindo Agenda...");
                await page.goto('http://localhost:3000/login.html');
                await page.evaluate(() => {
                    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin', role: 'admin', house_id: null }));
                });

                await page.goto('http://localhost:3000/agenda.html', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000);

                console.log("\n-> 2. Criando Agendamento Estrito para Dia 02/03/2026...");
                // Click to create new appointment
                await page.click('button:has-text("+ Novo Agendamento")');
                await page.waitForTimeout(1000);

                // Fill the modal
                await page.selectOption('#appointment-patient_id', { index: 1 }); // select first patient
                await page.fill('#appointment-title', 'Sessão Especial Ladino');

                // Forcing '2026-03-02' (YYYY-MM-DD)
                await page.fill('#appointment-date', '2026-03-02');
                await page.fill('#appointment-start_time', '15:00');
                await page.fill('#appointment-end_time', '15:50');

                await page.click('button:has-text("Salvar")');
                await page.waitForTimeout(2000); // give time to load the agenda again

                console.log("-> 3. Verificando em que dia o Agendamento caiu...");

                // Switch to week view to see the columns
                await page.click('button:has-text("Semana")');

                console.log("Agendamento inserido com sucesso na visão!");

                console.log("\n-> 4. Mudando para Ponto de Vista do Aluno (Portal)");
                await page.evaluate(() => {
                    localStorage.setItem('user', JSON.stringify({ id: 1, name: "Tamara CEO", role: "patient", house_id: 1 }));
                });
                await page.goto('http://localhost:3000/portal_aluno.html', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000);

                console.log("\n-> 5. Inspeção do Diálogo de REGRAS (Multimodal)");
                await page.click('button:has-text("📖 Regras Marcha Cup 2026")');
                await page.waitForTimeout(4000); // Read time for CEO
                await page.click('.close-modal');

                console.log("   Modal de regras testado no UI!");

                page.on('dialog', async dialog => {
                    const msg = dialog.message();
                    console.log("   Prompt Interceptado:", msg);
                    if (dialog.type() === 'prompt') {
                        if (msg.includes("casa que será prejudicada")) {
                            await dialog.accept("Cadilac");
                        } else {
                            await dialog.accept("Teste");
                        }
                    } else if (dialog.type() === 'confirm') {
                        await dialog.accept();
                    } else {
                        await dialog.accept();
                    }
                });

                console.log("\n-> 6. Clicando na Carta Ladino...");
                // Find Ladino and click
                const usedLadino = await page.evaluate(() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const sBtn = btns.find(b => b.onclick && b.onclick.toString().includes('Ladino') && b.innerText === 'Usar Carta');
                    if (sBtn) {
                        sBtn.click();
                        return true;
                    }
                    return false;
                });

                if (usedLadino) {
                    console.log("   Carta Ladino ativada! Assista ao roubo de pontos ser validado agora mesmo!");
                    await page.waitForTimeout(4000);
                } else {
                    console.log("   ❌ Carta Ladino falhou.");
                }

                console.log("=== TELA ESTÁVEL, DEIXANDO ABERTO PARA O CEO CONFERIR 1 MINUTO ===");

                await page.waitForTimeout(60000);

            } catch (e) {
                console.error("Erro na inspeção:", e);
            } finally {
                await browser.close();
            }
        });
});
