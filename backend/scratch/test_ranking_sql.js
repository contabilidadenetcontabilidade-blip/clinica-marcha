const db = new (require('sqlite3').Database)('C:/Marcha/database.sqlite');

const query = `
    SELECT h.id, h.name, h.color, h.crest,
           COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) as total_points
    FROM houses h
    LEFT JOIN athletes a ON h.id = a.house_id
    LEFT JOIN scores sc ON a.patient_id = sc.athlete_id
    LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE h.active = 1
    GROUP BY h.id
    ORDER BY total_points DESC
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('SQL ERROR:', err.message);
    } else {
        console.log('SUCCESS:', rows.length, 'rows');
    }
    process.exit();
});
