const fs = require('fs');
const db = require('./db.js');

const sql = fs.readFileSync('reset-scores-athletes.sql', 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("✅ Script executado");
    
    db.get("SELECT COUNT(*) as count FROM scores", (err, row) => {
      console.log("Scores restantes:", row.count);
      
      db.get("SELECT COUNT(*) as count FROM athletes WHERE house_id IS NOT NULL", (err, row) => {
        console.log("Athletes com house:", row.count);
        
        db.get("SELECT COUNT(*) as count FROM card_queue", (err, row) => {
          console.log("Cards na fila:", row.count);
          process.exit(0);
        });
      });
    });
  }
});
