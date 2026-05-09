const db = require('../db');
db.run("UPDATE houses SET name = 'Cadillac' WHERE name = 'Cadilac'", [], function(err) {
    if (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
    console.log('✅ Sucesso! Linhas alteradas:', this.changes);
    db.all('SELECT name FROM houses', (err, rows) => {
        console.log('📋 Lista Atualizada:', rows.map(r => r.name).join(', '));
        db.close();
        process.exit(0);
    });
});
