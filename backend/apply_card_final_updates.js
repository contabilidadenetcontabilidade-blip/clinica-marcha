const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

const updates = [
    { name: 'Spoiler', desc: 'Escolha uma casa adversária e descubra a parcial de meinhas dela neste mês' },
    { name: 'Vida', desc: 'Anula uma falta' },
    { name: 'Senhorinha', desc: 'Escolha um exercício difícil pra valer 2 meinhas' },
    { name: 'Marombinha', desc: 'Escolha um exercício fácil pra valer 1 meinha' },
    { name: 'Ladino', desc: 'Rouba 3 meinhas de uma casa adversária' },
    { name: 'Reverso', desc: 'O feitiço vira contra o feiticeiro' },
    { name: 'Influencer', desc: 'Mídias sociais valem o dobro de meinhas por uma semana' },
    { name: 'Zica', desc: 'As faltas de uma casa rival valerão o dobro por uma semana' },
    { name: 'Coringa', desc: 'Por uma semana as conquistas de um capitão adversário vão para você' },
    { name: 'Trapaça', desc: 'Aumenta em 15% a meta mensal de meinhas de um adversário' },
    { name: 'VAR', desc: 'Obriga um adversário a repetir um pomo do mês e rouba o pomo se ele fracassar' },
    { name: 'Tandera', desc: 'Revela as cartas de uma casa adversária' },
    { name: 'Invisibilidade', desc: 'Veta a ação de qualquer carta' },
    { name: 'Aliança', desc: 'Um capitão adversário disputa um pomo por você em troca de uma carta lendária caso vença' },
    { name: 'Golpe de Estado', desc: 'A casa em último rouba as conquistas da casa em primeiro por uma semana' }
];

db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE cards SET description = ? WHERE name = ?");
    updates.forEach(u => {
        stmt.run(u.desc, u.name);
    });
    stmt.finalize();
    
    db.run("DELETE FROM cards WHERE name IN ('Pomo', 'Mídias sociais')");
    
    db.run("COMMIT", (err) => {
        if (err) {
            console.error("Erro ao aplicar transação:", err.message);
        } else {
            console.log("Atualizações e deleções aplicadas com sucesso.");
        }
        db.close();
    });
});
