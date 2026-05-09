const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const officialCards = [
    // COMUNS
    { name: 'Spoiler', rarity: 'Comum', desc: 'Escolha uma casa adversária e descubra a parcial de meinhas dela neste mês.' },
    { name: 'Vida', rarity: 'Comum', desc: 'Anula a perda de pontos de 1 falta.' },
    { name: 'Senhorinha', rarity: 'Comum', desc: 'O aluno ganha o direito de realizar um desafio difícil valendo 2 meinhas.' },
    { name: 'Marombinha', rarity: 'Comum', desc: 'O aluno ganha o direito de realizar um desafio fácil valendo 1 meinha.' },

    // RARAS
    { name: 'Ladino', rarity: 'Rara', desc: 'Rouba 3 meinhas de uma casa adversária imediatamente.' },
    { name: 'Zica', rarity: 'Rara', desc: 'As faltas de uma casa adversária valem o dobro por 1 semana.' },
    { name: 'Reverso', rarity: 'Rara', desc: 'O feitiço da carta defendida vira contra o feiticeiro (Reflete o ataque).' },
    { name: 'Influencer', rarity: 'Rara', desc: 'Mídias sociais (Stories/Reels) valem o dobro de meinhas por 1 semana.' },

    // ÉPICAS
    { name: 'Coringa', rarity: 'Épica', desc: 'Por uma semana, as conquistas de um capitão adversário vão para você.' },
    { name: 'Trapaça', rarity: 'Épica', desc: 'Aumenta em 15% a meta mensal de meinhas de uma casa adversária.' },
    { name: 'VAR', rarity: 'Épica', desc: 'Obriga um adversário a repetir um Pomo do mês; se ele fracassar, você rouba o Pomo.' },

    // LENDÁRIAS
    { name: 'Tandera', rarity: 'Lendária', desc: 'Revela todas as cartas que uma casa adversária possui na mão.' },
    { name: 'Invisibilidade', rarity: 'Lendária', desc: 'Veta a ação de qualquer carta lançada contra você.' },
    { name: 'Aliança', rarity: 'Lendária', desc: 'Um capitão rival disputa um Pomo por você. Se ele vencer, o Pomo é seu e ele ganha a carta lendária.' },
    { name: 'Golpe de Estado', rarity: 'Lendária', desc: 'A casa em último lugar rouba as conquistas da casa em primeiro por 1 semana.' }
];

db.serialize(() => {
    officialCards.forEach(c => {
        // Realiza o UPDATE em todas as cartas cujo nome bate, ou se houver minúsculas/maiúsculas. Correção garantida.
        db.run("UPDATE cards SET rarity = ?, description = ? WHERE name = ? COLLATE NOCASE", [c.rarity, c.desc, c.name]);
    });

    db.all("SELECT id, name, rarity, description FROM cards ORDER BY id ASC", [], (err, rows) => {
        console.log("🔥 SINCRONIZAÇÃO COMPLETA COM O MANUAL 2026 🔥");
        console.table(rows);
    });
});
