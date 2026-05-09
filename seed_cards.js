const db = require('./backend/db');
const fs = require('fs');
const path = require('path');

const CARDS_DIR = path.join(__dirname, 'cartas');

console.log(`=== SEEDING CARTAS de ${CARDS_DIR} ===`);

if (fs.existsSync(CARDS_DIR)) {
    const files = fs.readdirSync(CARDS_DIR);

    db.serialize(() => {
        const stmt = db.prepare("INSERT OR IGNORE INTO cards (name, image_path, active) VALUES (?, ?, 1)");

        files.forEach(file => {
            if (file.match(/\.(png|jpg|jpeg|gif)$/i)) {
                // Nome da carta: remove extensão e capitaliza
                const name = file.replace(/\.[^/.]+$/, "").toUpperCase();
                // Caminho relativo para o frontend (assumindo que vamos servir /cartas como static)
                // O frontend serve assets, mas 'cartas' está na raiz. Vamos precisar de rota estática.
                const imagePath = `/api/cards/image/${file}`;

                console.log(`Inserindo carta: ${name}`);
                stmt.run(name, imagePath, (err) => {
                    if (err) console.error(`Erro na carta ${name}:`, err.message);
                });

            }
        });

        stmt.finalize();
        console.log("Cartas inseridas no banco.");
    });
} else {
    console.error(`Diretório ${CARDS_DIR} não encontrado!`);
}
