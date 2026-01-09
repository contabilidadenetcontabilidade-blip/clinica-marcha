// Script para inicializar as 5 casas padrão da Marcha Cup
const db = require('./db');

const defaultHouses = [
  { name: 'Cadillac', color: '#1E88E5', description: 'Casa Cadillac' },
  { name: 'Reformer', color: '#E53935', description: 'Casa Reformer' },
  { name: 'Chair', color: '#43A047', description: 'Casa Chair' },
  { name: 'Barrel', color: '#FB8C00', description: 'Casa Barrel' },
  { name: 'Tower', color: '#8E24AA', description: 'Casa Tower' }
];

db.serialize(() => {
  defaultHouses.forEach((house, index) => {
    db.get('SELECT id FROM houses WHERE name = ?', [house.name], (err, row) => {
      if (err) {
        console.error(`Erro ao verificar casa ${house.name}:`, err);
        return;
      }
      
      if (!row) {
        db.run(
          'INSERT INTO houses (name, color, active) VALUES (?, ?, 1)',
          [house.name, house.color],
          function(err) {
            if (err) {
              console.error(`Erro ao inserir casa ${house.name}:`, err);
            } else {
              console.log(`✅ Casa ${house.name} criada (ID: ${this.lastID})`);
            }
          }
        );
      } else {
        console.log(`ℹ️  Casa ${house.name} já existe`);
      }
    });
  });
  
  setTimeout(() => {
    console.log('\n✅ Inicialização das casas concluída!');
    process.exit(0);
  }, 1000);
});



