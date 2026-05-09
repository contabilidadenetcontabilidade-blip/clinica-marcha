const db = require('./db'); 
db.all('SELECT * FROM scores LIMIT 5', (e, r) => { 
  console.log('Scores All:', JSON.stringify(r, null, 2)); 
}); 
db.all('SELECT * FROM house_points_log LIMIT 5', (e, r) => { 
  console.log('House Points All:', JSON.stringify(r, null, 2)); 
  process.exit(0);
});
