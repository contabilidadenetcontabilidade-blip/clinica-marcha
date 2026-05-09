const db = require('./db');

// Find an unused card for student 10009
db.get(`
  SELECT sc.id, sc.hash, c.name 
  FROM student_cards sc 
  JOIN cards c ON sc.card_id = c.id 
  WHERE sc.student_id = 10009 AND sc.used = 0 
  LIMIT 1
`, (err, card) => {
    if (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
    if (!card) {
        console.error("No unused cards found for student 10009.");
        process.exit(1);
    }

    console.log(`Found card: ID=${card.id}, Name=${card.name}, Hash=${card.hash}`);

    // Make the API call
    fetch('http://localhost:3000/api/usar-carta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_card_id: card.id,
            hash: card.hash,
            card_name: card.name,
            description: 'Joseph'
        })
    })
        .then(res => Promise.all([res.status, res.json()]))
        .then(([status, data]) => {
            console.log(`API Response Status: ${status}`);
            console.log("API Response Body:", data);
            process.exit(0);
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            process.exit(1);
        });
});
