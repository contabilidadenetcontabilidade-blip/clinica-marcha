const db = require('../db');

// Migrando pontos do house_points_log para a tabela scores
// Usamos student_id como fallback para patient_id para cobrir registros antigos
const query = `
  UPDATE scores
  SET points = (
    SELECT hpl.points_awarded 
    FROM house_points_log hpl
    WHERE (hpl.patient_id = scores.athlete_id OR hpl.student_id = scores.athlete_id)
      AND hpl.created_at >= scores.created_at 
      AND hpl.created_at <= datetime(scores.created_at, '+5 seconds')
    LIMIT 1
  )
  WHERE points IS NULL
`;

db.run(query, function(err) {
  if (err) {
    console.error('ERRO:', err.message);
  } else {
    console.log('✅ Migração concluída!', this.changes, 'registros atualizados');
  }
  process.exit();
});
