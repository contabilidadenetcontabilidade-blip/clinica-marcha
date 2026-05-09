const db = require('./db.js');

db.serialize(() => {
  db.run("PRAGMA foreign_keys = OFF;");
  
  // Apagar atletas (vínculos com casas)
  db.run("DELETE FROM athletes;");
  
  // Apagar pacientes (alunos)
  db.run("DELETE FROM patients WHERE role = 'atleta' OR role = 'student' OR role IS NULL;");
  
  // Reativar FKs
  db.run("PRAGMA foreign_keys = ON;");

  db.get("SELECT COUNT(*) as c FROM patients WHERE role NOT IN ('admin', 'coord', 'master')", (err, row) => {
    console.log("Pacientes restantes (esperado 0):", row ? row.c : err);
    process.exit(0);
  });
});
