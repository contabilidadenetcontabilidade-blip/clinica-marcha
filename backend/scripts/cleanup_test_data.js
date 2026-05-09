const db = require('../db');

const preservedIds = [1, 9999, 90, 91, 10009];
const idString = preservedIds.join(',');

async function cleanup() {
    console.log(`--- STARTING REFINED DATABASE CLEANUP (Preserving IDs: ${idString}) ---`);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. house_points_log
        db.run(`DELETE FROM house_points_log WHERE student_id NOT IN (${idString}) AND student_id IS NOT NULL`, function (err) {
            console.log(`house_points_log deleted: ${this.changes}`);
        });

        // 2. scores (via athletes)
        db.all(`SELECT id FROM athletes WHERE patient_id IN (${idString})`, (err, rows) => {
            const preservedAthleteIds = rows ? rows.map(r => r.id).join(',') : '';
            const athleteCondition = preservedAthleteIds ? `athlete_id NOT IN (${preservedAthleteIds})` : "1=1";
            db.run(`DELETE FROM scores WHERE ${athleteCondition}`, function (err) {
                console.log(`scores deleted: ${this.changes}`);
            });
        });

        // 3. student_cards
        db.run(`DELETE FROM student_cards WHERE student_id NOT IN (${idString})`, function (err) {
            console.log(`student_cards deleted: ${this.changes}`);
        });

        // 4. appointments
        db.run(`DELETE FROM appointments WHERE patient_id NOT IN (${idString}) AND patient_id IS NOT NULL`, function (err) {
            console.log(`appointments deleted: ${this.changes}`);
        });

        // 5. financial_transactions
        db.run(`DELETE FROM financial_transactions WHERE patient_id NOT IN (${idString}) AND patient_id IS NOT NULL`, function (err) {
            console.log(`financial_transactions deleted: ${this.changes}`);
        });

        // 6. athletes
        db.run(`DELETE FROM athletes WHERE patient_id NOT IN (${idString}) AND patient_id IS NOT NULL`, function (err) {
            console.log(`athletes deleted: ${this.changes}`);
        });

        // 7. patients
        db.run(`DELETE FROM patients WHERE id NOT IN (${idString}) AND role NOT IN ('admin', 'fisio')`, function (err) {
            if (err) console.error('Error patients:', err.message);
            else console.log(`patients deleted: ${this.changes}`);
        });

        db.run("COMMIT", (err) => {
            if (err) console.error('Commit error:', err.message);
            else console.log('Cleanup committed successfully.');
        });
    });
}

cleanup();

setTimeout(() => {
    console.log('Cleanup process finished.');
    process.exit(0);
}, 3000);
