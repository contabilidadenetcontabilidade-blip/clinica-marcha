const db = require('./db');

db.get("SELECT * FROM athletes WHERE patient_id = 10009", (err, row) => {
    if (err) return console.error(err);
    if (!row) {
        console.log("Athlete not found for patient_id 10009. Inserting...");
        db.get("SELECT id FROM houses WHERE name LIKE '%Joseph%'", (err, h) => {
            let houseId = h ? h.id : 1;
            db.run("INSERT INTO athletes (name, house_id, patient_id) SELECT name, ?, id FROM patients WHERE id = 10009", [houseId], function (err) {
                if (err) console.error("Error inserting athlete:", err);
                else console.log("Athlete created with ID", this.lastID);
                process.exit(0);
            });
        });
    } else {
        console.log("Athlete already exists:", row);
        process.exit(0);
    }
});
