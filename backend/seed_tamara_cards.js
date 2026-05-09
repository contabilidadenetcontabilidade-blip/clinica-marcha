const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

db.serialize(() => {
    db.get("SELECT a.id FROM athletes a JOIN patients p ON a.patient_id = p.id WHERE p.name LIKE '%tamara%' LIMIT 1", (err, ath) => {
        if (err) {
            console.error(err);
        } else if (ath) {
            db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, ?, 0)", [ath.id, 16, 'hash111']);
            db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, ?, 0)", [ath.id, 27, 'hash222'], () => {
                console.log("Inserted cards for Tamara! athlete_id:", ath.id);
                // Also verify it
                db.all("SELECT * FROM student_cards WHERE student_id = ?", [ath.id], (err, rows) => {
                    console.log("Tamara's student_cards:", rows);
                });
            });
        } else {
            console.log("No athlete found for Tamara. Let's create an athlete for patient ID 1.");
            db.run("INSERT INTO athletes (patient_id, house_id, role) VALUES (1, 1, 'atleta')", function (err) {
                if (err) console.error(err);
                const newAthId = this.lastID;
                if (newAthId) {
                    db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, ?, 0)", [newAthId, 16, 'hash111']);
                    db.run("INSERT INTO student_cards (student_id, card_id, hash, used) VALUES (?, ?, ?, 0)", [newAthId, 27, 'hash222'], () => {
                        console.log("Created athlete and inserted cards! ID:", newAthId);
                    });
                }
            });
        }
    });
});
