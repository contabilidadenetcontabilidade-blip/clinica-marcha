const db = require('./backend/db');

console.log("=== FIXING HOUSE CRESTS ===");

db.serialize(() => {
    // Force specific crest paths
    const updates = [
        { name: 'Barrel', crest: '../assets/img/Brasoes/barrel.png' },
        { name: 'Reformer', crest: '../assets/img/Brasoes/reformer.png' },
        { name: 'Cadilac', crest: '../assets/img/Brasoes/Cadilac.png' },
        { name: 'Chair', crest: '../assets/img/Brasoes/chair.png' },
        { name: 'Joseph', crest: '../assets/img/Brasoes/joseph.png' }
    ];

    updates.forEach(house => {
        db.run("UPDATE houses SET crest = ? WHERE name LIKE ?", [house.crest, `%${house.name}%`], function (err) {
            if (err) console.error(`Error updating ${house.name}:`, err);
            else console.log(`${house.name} crest updated (changes: ${this.changes})`);
        });
    });

    db.all("SELECT * FROM houses", [], (err, rows) => {
        if (err) console.error(err);
        else console.log("Final Houses Crests:", rows);
    });
});
