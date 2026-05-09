const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Adiciona a coluna se não existir
    db.run("ALTER TABLE cards ADD COLUMN rarity TEXT DEFAULT 'Comum'", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error("Erro ao alterar tabela:", err);
        } else {
            console.log("Coluna rarity garantida na tabela cards.");
        }
    });

    // Populate das cartas com suas raridades e descrições
    const cards = [
        { name: 'Curinga', rarity: 'Épica', desc: 'Retira 10 pontos da carta alvo. MODO STEALTH ativo.' },
        { name: 'Coringa', rarity: 'Épica', desc: 'Retira 10 pontos da carta alvo. MODO STEALTH ativo.' },
        { name: 'Ladino', rarity: 'Comum', desc: 'Rouba pontos não defendidos.' },
        { name: 'Zica', rarity: 'Rara', desc: 'Aplica um debuff de pontos.' },
        { name: 'Influencer', rarity: 'Rara', desc: 'Multiplica ganhos por 2.0x.' },
        { name: 'VAR', rarity: 'Lendária', desc: 'Rouba o Pomo de Ouro da casa adversária.' },
        { name: 'Spoiler', rarity: 'Comum', desc: 'Revela a fila de cartas do rival.' },
        { name: 'Trapaça', rarity: 'Rara', desc: 'Interrompe ações inimigas.' },
        { name: 'Invisibilidade', rarity: 'Rara', desc: 'Defesa contra ataques furtivos.' },
        { name: 'Reverso', rarity: 'Épica', desc: 'Reflete prejuízos de volta à origem.' },
        { name: 'Tandera', rarity: 'Comum', desc: 'Vê as casas alvo que sofrerão efeito.' }
    ];

    cards.forEach(c => {
        db.run("UPDATE cards SET rarity = ?, description = ? WHERE name = ? OR name LIKE ?", [c.rarity, c.desc, c.name, `%${c.name}%`]);
    });

    // Garanta que exista pelo menos o Coringa, VAR, etc se a tabela estiver vazia
    db.get("SELECT COUNT(*) as count FROM cards", [], (err, row) => {
        if (row && row.count === 0) {
            console.log("Tabela cards vazia. Populando as cartas iniciais...");
            cards.forEach(c => {
                db.run("INSERT INTO cards (name, description, rarity, image_path, active) VALUES (?, ?, ?, ?, 1)", [c.name, c.desc, c.rarity, `/cartas/${c.name.toLowerCase()}.png`]);
            });
        }

        console.log("Banco corrigido. Pode testar.");
    });
});
