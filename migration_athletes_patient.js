const db = require('./backend/db');

console.log("=== ADICIONANDO COLUNA PATIENT_ID EM ATHLETES ===");

db.serialize(() => {
    // Check if column exists
    db.all("PRAGMA table_info(athletes)", [], (err, rows) => {
        if (err) {
            console.error("Erro ao verificar schema:", err);
            return;
        }

        const hasColumn = rows.some(r => r.name === 'patient_id');
        if (!hasColumn) {
            console.log("Coluna patient_id não encontrada. Adicionando...");
            db.run("ALTER TABLE athletes ADD COLUMN patient_id INTEGER REFERENCES patients(id)", function (err) {
                if (err) console.error("Erro ao adicionar coluna:", err);
                else console.log("Coluna adicionada com sucesso.");

                // Link Student 2 (Test) to an Athlete (create if needed or link to first)
                linkTestUser();
            });
        } else {
            console.log("Coluna patient_id já existe.");
            linkTestUser();
        }
    });
});

function linkTestUser() {
    // Find an athlete
    db.get("SELECT id FROM athletes LIMIT 1", [], (err, athlete) => {
        if (athlete) {
            db.run("UPDATE athletes SET patient_id = 2 WHERE id = ?", [athlete.id], (err) => {
                if (err) console.error("Erro ao vincular teste:", err);
                else console.log(`Atleta ${athlete.id} vinculado ao Paciente 2.`);
            });
        } else {
            // Create a test athlete for House 1 (Joseph)
            db.run("INSERT INTO athletes (name, house_id, patient_id) VALUES ('Aluno Teste', 1, 2)", (err) => {
                if (err) console.error("Erro ao criar atleta teste:", err);
                else console.log("Atleta de teste criado e vinculado.");
            });
        }
    });
}
