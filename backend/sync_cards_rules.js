const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

const cards = [
    { name: 'Coringa', file: 'coringa.jpeg', rarity: 'Épica' },
    { name: 'Tandera', file: 'tandera.jpeg', rarity: 'Lendária' },
    { name: 'Trapaça', file: 'trapaca.jpeg', rarity: 'Épica' },
    { name: 'VAR', file: 'var.jpeg', rarity: 'Épica' },
    { name: 'Vida', file: 'vida.jpeg', rarity: 'Comum' },
    { name: 'Zica', file: 'zica.jpeg', rarity: 'Raro' },
    { name: 'Ladino', file: 'ladino.jpeg', rarity: 'Raro' },
    { name: 'Marombinha', file: 'marombinha.jpeg', rarity: 'Comum' },
    { name: 'Reverso', file: 'reverso.jpeg', rarity: 'Raro' },
    { name: 'Senhorinha', file: 'senhorinha.jpeg', rarity: 'Comum' },
    { name: 'Spoiler', file: 'spoiler.jpeg', rarity: 'Comum' },
    { name: 'Aliança', file: 'alianca.jpeg', rarity: 'Lendária' },
    { name: 'Golpe de Estado', file: 'golpe_de_estado.jpeg', rarity: 'Lendária' },
    { name: 'Invisibilidade', file: 'invisibilidade.jpeg', rarity: 'Lendária' },
    { name: 'Influencer', file: 'influencer.jpeg', rarity: 'Raro' }
];

db.serialize(() => {
    // Clear the table to start fresh with the exact 15 cards
    db.run("DELETE FROM cards");

    cards.forEach(c => {
        // 1. Insert into cards table (without rarity)
        db.run(
            "INSERT INTO cards (name, image_path, active) VALUES (?, ?, 1)",
            [c.name, '/cartas/' + c.file],
            (err) => {
                if (err) console.error("Error inserting card:", c.name, err.message);
            }
        );

        // 2. Insert into scoring_rules if it does not exist
        db.get("SELECT id FROM scoring_rules WHERE name = ?", [c.name], (err, row) => {
            if (!row) {
                db.run(
                    "INSERT INTO scoring_rules (name, value, category, active) VALUES (?, 0, 'Especial', 1)",
                    [c.name],
                    (err) => {
                        if (err) console.error("Error creating rule for", c.name, err.message);
                    }
                );
            }
        });
    });
    console.log("Successfully seeded 15 cards and rules.");
});
