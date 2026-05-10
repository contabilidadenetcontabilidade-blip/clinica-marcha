const db = require('../backend/db');
db.serialize(() => {
    db.run("UPDATE scoring_rules SET value = 1 WHERE id = 1", (err) => {
        if (err) console.error("Error updating rule:", err);
        else console.log("Rule updated!");
    });
    db.run("DELETE FROM scores WHERE points = 100 OR points = -100", (err) => {
        if (err) console.error("Error deleting scores:", err);
        else console.log("Inflated scores deleted!");
    });
});
setTimeout(() => process.exit(), 2000);
