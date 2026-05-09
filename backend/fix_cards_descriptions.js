const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. VIDA
    db.run(`UPDATE cards SET description = 'Anula a perda de pontos de 1 falta.' WHERE name = 'Vida'`);
    // 2. MAROMBINHA
    db.run(`UPDATE cards SET description = 'O aluno ganha o direito de realizar um desafio fácil valendo 1 meinha.' WHERE name = 'Marombinha'`);
    // 3. SENHORINHA
    db.run(`UPDATE cards SET description = 'O aluno ganha o direito de realizar um desafio difícil valendo 2 meinhas.' WHERE name = 'Senhorinha'`);
    // 4. ALIANÇA (Raridade + Descrição)
    db.run(`UPDATE cards SET rarity = 'Lendária', description = 'Um capitão rival disputa um Pomo por você. Se ele vencer, o Pomo é seu e ele ganha a carta lendária.' WHERE name = 'Aliança'`);
    // 5. GOLPE DE ESTADO (Raridade + Descrição)
    db.run(`UPDATE cards SET rarity = 'Lendária', description = 'A casa em último lugar rouba as conquistas da casa em primeiro por 1 semana.' WHERE name = 'Golpe de Estado'`);

    // Validar atualização
    db.all("SELECT id, name, rarity, description FROM cards WHERE description IS NOT NULL", [], (err, rows) => {
        console.log("Cartas atualizadas com sucesso nas regras oficiais 2026:");
        console.table(rows);
    });
});
