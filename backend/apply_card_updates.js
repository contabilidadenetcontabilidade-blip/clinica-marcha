const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');

const updates = [
    ['Escolha uma casa adversária e descubra a parcial de meinhas dela neste mês', 'Spoiler'],
    ['Anula uma falta', 'Vida'],
    ['Escolha um exercício difícil pra valer 2 meinhas', 'Senhorinha'],
    ['Escolha um exercício fácil pra valer 1 meinha', 'Marombinha'],
    ['Rouba 3 meinhas de uma casa adversária', 'Ladino'],
    ['O feitiço vira contra o feiticeiro', 'Reverso'],
    ['Mídias sociais valem o dobro de meinhas por uma semana', 'Influencer'],
    ['As faltas de uma casa rival valerão o dobro por uma semana', 'Zica'],
    ['Por uma semana as conquistas de um capitão adversário vão para você', 'Coringa'],
    ['Aumenta em 15% a meta mensal de meinhas de um adversário', 'Trapaça'],
    ['Obriga um adversário a repetir um pomo do mês e rouba o pomo se ele fracassar', 'VAR'],
    ['Revela as cartas de uma casa adversária', 'Tandera'],
    ['Veta a ação de qualquer carta', 'Invisibilidade'],
    ['Um capitão adversário disputa um pomo por você em troca de uma carta lendária caso vença', 'Aliança'],
    ['A casa em último rouba as conquistas da casa em primeiro por uma semana', 'Golpe de Estado']
];

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare("UPDATE cards SET description = ? WHERE name = ?");
    updates.forEach(upd => {
        stmt.run(upd, function(err) {
            if (err) console.error(`Erro ao atualizar ${upd[1]}:`, err.message);
        });
    });
    stmt.finalize();

    db.run("DELETE FROM cards WHERE name IN ('Pomo', 'Mídias sociais')", function(err) {
        if (err) {
            console.error("Erro ao deletar cartas:", err.message);
        } else {
            console.log(`Cartas deletadas: ${this.changes}`);
        }
    });

    db.run("COMMIT", (err) => {
        if (err) {
            console.error("Erro ao finalizar transação:", err.message);
        } else {
            console.log("Transação concluída com sucesso.");
        }
        db.close();
    });
});
