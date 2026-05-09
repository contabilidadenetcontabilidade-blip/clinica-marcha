const db = require('../db');

async function migrate() {
    console.log('--- CHECKING INVENTORY FOR ID 1 ---');

    db.all("SELECT * FROM student_cards WHERE student_id = 1", (err, cards) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Found ${cards.length} cards for student_id 1.`);
            console.table(cards);

            if (cards.length > 0) {
                console.log('Migrating cards to student_id 10009...');
                db.run("UPDATE student_cards SET student_id = 10009 WHERE student_id = 1", function (err) {
                    if (err) console.error('Migration error:', err.message);
                    else console.log(`Migrated ${this.changes} cards.`);
                });
            }
        }
    });

    console.log('--- CHECKING ATHLETES FOR patient_id 1 ---');
    db.all("SELECT * FROM athletes WHERE patient_id = 1", (err, aths) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Found ${aths.length} athlete records for patient_id 1.`);
            console.table(aths);

            if (aths.length > 0) {
                console.log('Removing links to patient_id 1 in athletes table...');
                db.run("UPDATE athletes SET patient_id = NULL WHERE patient_id = 1", function (err) {
                    if (err) console.error('Update error:', err.message);
                    else console.log(`Cleared patient_id link for ${this.changes} athlete(s).`);
                });
            }
        }
    });

    // Also check if ID 1 itself is in a house in the patients table
    db.get("SELECT name, house_id FROM patients WHERE id = 1", (err, row) => {
        if (row && row.house_id) {
            console.log(`Clearing house_id ${row.house_id} from patient ID 1.`);
            db.run("UPDATE patients SET house_id = NULL WHERE id = 1");
        } else {
            console.log('Patient ID 1 has no house_id set.');
        }
    });
}

migrate();

setTimeout(() => {
    console.log('Process finished.');
    process.exit(0);
}, 3000);
