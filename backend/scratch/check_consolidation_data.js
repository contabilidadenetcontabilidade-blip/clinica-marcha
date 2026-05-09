const db = require('../db');

// Check weekly points
const query = `
  SELECT a.house_id, h.name, SUM(sc.points) as weekly_points
  FROM scores sc
  JOIN athletes a ON sc.athlete_id = a.patient_id
  JOIN houses h ON a.house_id = h.id
  WHERE sc.created_at >= date('now', 'weekday 1', '-7 days')  -- Start of current week (Monday)
  GROUP BY a.house_id
  ORDER BY weekly_points DESC
`;

db.all(query, [], (e, r) => {
    console.log('WEEKLY_POINTS:', r);
    // Check if attendance table exists and has data
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'", [], (e2, r2) => {
        console.log('ATTENDANCE_EXISTS:', r2.length > 0);
        if (r2.length > 0) {
            db.all("SELECT * FROM attendance LIMIT 3", [], (e3, r3) => console.log('ATTENDANCE_SAMPLE:', r3));
        }
        process.exit();
    });
});
