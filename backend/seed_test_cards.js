const db = require('./db');
const studentId = 10009;

db.get("SELECT count(*) as count FROM student_cards WHERE student_id = ?", [studentId], (err, row) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Cards count for ${studentId}: ${row.count}`);

    if (row.count === 0) {
        console.log("Seeding test cards...");
        db.serialize(() => {
            // Get some card IDs
            db.all("SELECT id FROM cards LIMIT 3", [], (err, cards) => {
                if (err || !cards.length) {
                    console.error("No cards in DB to seed");
                    process.exit(1);
                }
                cards.forEach(c => {
                    const hash = Math.random().toString(16).substring(2, 10).toUpperCase();
                    db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, ?, 0)", [studentId, c.id, hash]);
                });
                console.log("Seeded 3 cards.");
            });
        });
    }
});

setTimeout(() => process.exit(0), 2000);
