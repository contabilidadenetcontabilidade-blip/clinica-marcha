// Script para inicializar regras padrão de pontuação do Marcha Cup
const db = require('./db');

const defaultRules = [
  { name: 'Presença na Aula', value: 10, description: 'Presença em qualquer aula' },
  { name: 'Desafio Completo', value: 20, description: 'Completou um desafio proposto' },
  { name: 'Atividade Extra', value: 15, description: 'Participou de atividade extra' },
  { name: 'Falta sem Aviso', value: -5, description: 'Faltou sem avisar' },
  { name: 'Atitude Destrutiva', value: -10, description: 'Comportamento inadequado' }
];

db.serialize(() => {
  defaultRules.forEach((rule, index) => {
    db.get('SELECT id FROM scoring_rules WHERE name = ?', [rule.name], (err, row) => {
      if (err) {
        console.error(`Erro ao verificar regra ${rule.name}:`, err);
        return;
      }
      
      if (!row) {
        db.run(
          'INSERT INTO scoring_rules (name, value, active) VALUES (?, ?, 1)',
          [rule.name, rule.value],
          function(err) {
            if (err) {
              console.error(`Erro ao inserir regra ${rule.name}:`, err);
            } else {
              console.log(`✅ Regra "${rule.name}" criada (ID: ${this.lastID})`);
            }
          }
        );
      } else {
        console.log(`ℹ️  Regra "${rule.name}" já existe`);
      }
    });
  });
  
  setTimeout(() => {
    console.log('\n✅ Inicialização das regras concluída!');
    process.exit(0);
  }, 1000);
});



