const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Atualizando caminhos de imagem das cartas...\n');

const updates = [
    "UPDATE cards SET image_path = '/api/cartas/spoiler.jpeg' WHERE name = 'Spoiler'",
    "UPDATE cards SET image_path = '/api/cartas/vida.jpeg' WHERE name = 'Vida'",
    "UPDATE cards SET image_path = '/api/cartas/senhorinha.jpeg' WHERE name = 'Senhorinha'",
    "UPDATE cards SET image_path = '/api/cartas/marombinha.jpeg' WHERE name = 'Marombinha'",
    "UPDATE cards SET image_path = '/api/cartas/ladino.jpeg' WHERE name = 'Ladino'",
    "UPDATE cards SET image_path = '/api/cartas/zica.jpeg' WHERE name = 'Zica'",
    "UPDATE cards SET image_path = '/api/cartas/reverso.jpeg' WHERE name = 'Reverso'",
    "UPDATE cards SET image_path = '/api/cartas/influencer.jpeg' WHERE name = 'Influencer'",
    "UPDATE cards SET image_path = '/api/cartas/coringa.jpeg' WHERE name = 'Coringa'",
    "UPDATE cards SET image_path = '/api/cartas/trapaca.jpeg' WHERE name = 'Trapaça'",
    "UPDATE cards SET image_path = '/api/cartas/var.jpeg' WHERE name = 'VAR'",
    "UPDATE cards SET image_path = '/api/cartas/tandera.jpeg' WHERE name = 'Tandera'",
    "UPDATE cards SET image_path = '/api/cartas/invisibilidade.jpeg' WHERE name = 'Invisibilidade'",
    "UPDATE cards SET image_path = '/api/cartas/alianca.jpeg' WHERE name = 'Aliança'",
    "UPDATE cards SET image_path = '/api/cartas/golpe de estado.jpeg' WHERE name = 'Golpe de Estado'"
];

let completed = 0;

updates.forEach((sql, index) => {
    db.run(sql, (err) => {
        if (err) {
            console.log(`❌ Erro: ${err.message}`);
        } else {
            console.log(`✅ ${index + 1}/15 atualizado`);
        }
        completed++;
        if (completed === updates.length) {
            console.log('\n✅ Todos os caminhos de imagem atualizados!');
            console.log('📂 Rota: /api/cartas/[nome].jpeg\n');
            db.close();
        }
    });
});
