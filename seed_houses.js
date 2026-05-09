const db = require('./backend/db');

// Map based on file names found in c:\Marcha\frontend\assets\img\Brasoes
const houses = [
    { name: 'Joseph', color: '#FFD700', crest: '/assets/img/Brasoes/joseph.png' }, // Gold
    { name: 'Cadilac', color: '#1976D2', crest: '/assets/img/Brasoes/Cadilac.png' }, // Blue
    { name: 'Reformer', color: '#D32F2F', crest: '/assets/img/Brasoes/reformer.png' }, // Red
    { name: 'Barrel', color: '#388E3C', crest: '/assets/img/Brasoes/barrel.png' }, // Green
    { name: 'Chair', color: '#F57C00', crest: '/assets/img/Brasoes/chair.png' } // Orange
];

console.log("Iniciando reconstrução das casas (Pilates Theme)...");

db.serialize(() => {
    // Risky: Clear table to ensure only valid houses exist. 
    // User requested "Reconstruction".
    db.run("DELETE FROM houses", (err) => {
        if (err) console.error("Erro ao limpar casas:", err);
        else console.log("Tabela Houses limpa.");

        // Reset sequence?
        db.run("DELETE FROM sqlite_sequence WHERE name='houses'");

        const stmt = db.prepare("INSERT INTO houses (name, color, crest) VALUES (?, ?, ?)");

        let pending = houses.length;

        houses.forEach(house => {
            stmt.run(house.name, house.color, house.crest, (err) => {
                if (err) console.error(`Erro ao inserir ${house.name}:`, err);
                else console.log(`Casa inserida: ${house.name}`);

                pending--;
                if (pending === 0) {
                    setTimeout(() => {
                        console.log("Seeding concluído.");
                        // db.close(); // Shared connection, let process exit handle it?
                        process.exit(0);
                    }, 500);
                }
            });
        });
        stmt.finalize();
    });
});
