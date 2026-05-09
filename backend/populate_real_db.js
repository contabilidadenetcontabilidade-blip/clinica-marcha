const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Marcha\\database.sqlite');
const crypto = require('crypto');

const deckInfo = [
    { name: "Coringa", img: "coringa.jpeg", points: 0 },
    { name: "Tandera", img: "tandera.jpeg", points: 0 },
    { name: "Trapaça", img: "trapaca.jpeg", points: 0 },
    { name: "VAR", img: "var.jpeg", points: 0 },
    { name: "Vida", img: "vida.jpeg", points: 0 },
    { name: "Zica", img: "zica.jpeg", points: 0 },
    { name: "Ladino", img: "ladino.jpeg", points: -3 }, // Subtrai 3 do rival (ou lança -3 como logica padronizada na regra)
    { name: "Marombinha", img: "marombinha.jpeg", points: 0 },
    { name: "Reverso", img: "reverso.jpeg", points: 0 },
    { name: "Senhorinha", img: "senhorinha.jpeg", points: 2 }, // Some +2 meinhas
    { name: "Spoiler", img: "spoiler.jpeg", points: 0 },
    { name: "Invisibilidade", img: "invisibilidade.jpeg", points: 0 },
    { name: "Escudo", img: "escudo.jpeg", points: 0 },
    { name: "Pulo", img: "pulo.jpeg", points: 0 },
    { name: "Anula", img: "anula.jpeg", points: 0 }
];

db.serialize(() => {
    // Ensure tables exist
    db.run(`CREATE TABLE IF NOT EXISTS scoring_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value INTEGER NOT NULL, category TEXT DEFAULT 'Cartas', active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, rarity TEXT NOT NULL, image_url TEXT, active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS student_cards (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, card_id INTEGER, hash TEXT, used INTEGER DEFAULT 0, acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // Clear prep
    db.run(`DELETE FROM student_cards WHERE student_id = 1`);

    deckInfo.forEach(card => {
        // 1. Create scoring rule if points != 0
        if (card.points !== 0) {
            db.get('SELECT id FROM scoring_rules WHERE name = ?', [card.name], (err, row) => {
                if (!row) {
                    db.run('INSERT INTO scoring_rules (name, value, category) VALUES (?, ?, ?)', [card.name, card.points, 'Mecânica Marcha Cup']);
                } else {
                    db.run('UPDATE scoring_rules SET value = ? WHERE id = ?', [card.points, row.id]);
                }
            });
        }

        // 2. Insert into cards if missing
        db.get('SELECT id FROM cards WHERE name = ?', [card.name], (err, row) => {
            let cardId = 0;
            if (!row) {
                db.run('INSERT INTO cards (name, rarity, image_url) VALUES (?, ?, ?)', [card.name, 'Comum', card.img], function (e) {
                    if (!e) insertStudentCard(this.lastID);
                });
            } else {
                db.run('UPDATE cards SET image_url = ? WHERE id = ?', [card.img, row.id], () => {
                    insertStudentCard(row.id);
                });
            }

            function insertStudentCard(cId) {
                const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
                db.run('INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (1, ?, ?, 0)', [cId, hash]);
            }
        });
    });

});

setTimeout(() => {
    console.log("Banco Populado com as 15 cartas reais e regras cadastradas (Senhorinha +2, Ladino -3)!");
    db.close();
}, 2000);
