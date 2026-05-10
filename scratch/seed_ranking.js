const db = require('../backend/db');

async function seed() {
    // Metas para Maio 2026
    const houses = [1, 2, 3, 4, 5];
    for (const hId of houses) {
        await new Promise((resolve) => {
            db.run("INSERT OR REPLACE INTO meta_meinhas (house_id, month, year, target) VALUES (?, '05', 2026, 100)", [hId], resolve);
        });
    }

    // Scores para Reformer (ID 3) atingir meta
    // Já tem 2 meinhas (de testes anteriores)
    // Vamos adicionar mais 100
    await new Promise((resolve) => {
        db.run("INSERT INTO scores (athlete_id, rule_id, points) VALUES (10174, 1, 100)", [], resolve);
    });
    
    // Adicionar um POMO para Cadillac (ID 2)
    // Precisamos de um atleta na casa 2. Vamos criar um se não houver.
    // Mas para o teste rápido, vou colocar na casa 3 mesmo e ver se o ponto do pomo aparece.
    await new Promise((resolve) => {
        db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (10174, 104)", [], resolve);
    });

    console.log("Seed concluído!");
    process.exit();
}

seed();
