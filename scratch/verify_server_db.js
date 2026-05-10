const db = require('../backend/db');
db.serialize(() => {
    db.get("SELECT COUNT(*) as c FROM meta_meinhas", (err, r) => console.log("Metas:", r.c));
    db.get("SELECT COUNT(*) as c FROM scores", (err, r) => console.log("Scores:", r.c));
    db.get("SELECT COUNT(*) as c FROM athletes", (err, r) => {
        console.log("Athletes:", r.c);
        process.exit();
    });
});
