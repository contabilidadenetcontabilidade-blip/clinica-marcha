const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🗑️  LIMPEZA RADICAL - APAGANDO TODAS AS REGRAS...\n');

// PASSO 1: DELETAR TODAS AS REGRAS
db.run('DELETE FROM scoring_rules', (err) => {
    if (err) {
        console.error('❌ Erro ao deletar:', err.message);
        db.close();
        return;
    }

    console.log('✅ TODAS as regras apagadas\n');
    console.log('📋 INSTALANDO REGULAMENTO 2026 (12 REGRAS EXCLUSIVAS)...\n');

    // PASSO 2: INSERIR APENAS AS 12 REGRAS DO REGULAMENTO 2026
    const regras2026 = [
        ['Presença', 1, 'Meinha'],
        ['Cor da Casa', 1, 'Meinha'],
        ['Story', 1, 'Meinha'],
        ['Reels/Feed', 2, 'Meinha'],
        ['Desafio Sala', 2, 'Meinha'],
        ['Evolução Técnica', 3, 'Meinha'],
        ['Indicação (Experimental)', 3, 'Meinha'],
        ['Conversão (Matrícula)', 2, 'Meinha'],
        ['Falta s/ Justificativa', -2, 'Punição'],
        ['Pomo (Meta)', 3, 'Pomo'],
        ['Pomo (Recorde)', 5, 'Pomo'],
        ['Bônus Capitão', 5, 'Capitão']
    ];

    const stmt = db.prepare('INSERT INTO scoring_rules (name, value, category, active) VALUES (?, ?, ?, 1)');

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        regras2026.forEach(r => {
            stmt.run(r[0], r[1], r[2]);
        });

        db.run('COMMIT', (err) => {
            if (err) {
                console.error('❌ Erro ao inserir:', err.message);
            } else {
                console.log('✅ 12 regras inseridas com sucesso!\n');

                // PASSO 3: VERIFICAR E LISTAR
                db.all('SELECT id, name, value, category FROM scoring_rules ORDER BY value DESC', (err, rows) => {
                    if (err) {
                        console.error('❌ Erro ao listar:', err.message);
                    } else {
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('  REGULAMENTO 2026 - LISTA FINAL (APÓS LIMPEZA)');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('  ID | REGRA                          | PONTOS | CATEGORIA');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                        rows.forEach(r => {
                            const sinal = r.value >= 0 ? '+' : '';
                            const id = String(r.id).padStart(4);
                            const nome = r.name.padEnd(30);
                            const pts = `${sinal}${r.value}`.padStart(6);
                            const cat = r.category.padEnd(10);
                            console.log(`  ${id} | ${nome} | ${pts} | ${cat}`);
                        });

                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log(`\n✅ Total: ${rows.length} regras`);

                        // Verificar se sobrou alguma regra indesejada
                        const indesejadas = rows.filter(r =>
                            r.name.includes('ser legal') ||
                            r.name.includes('Ser legal') ||
                            r.name.includes('Pomo de Ouro') ||
                            r.name.includes('Presente') ||
                            r.name.includes('Mascote') ||
                            r.value > 5 ||
                            r.value < -2
                        );

                        if (indesejadas.length > 0) {
                            console.log('\n⚠️  FALHA: Regras indesejadas encontradas:');
                            indesejadas.forEach(r => console.log(`   - ${r.name} (${r.value})`));
                        } else {
                            console.log('\n🎉 SUCESSO: Sistema limpo! Apenas Regulamento 2026 ativo.');
                        }
                    }

                    stmt.finalize();
                    db.close();
                });
            }
        });
    });
});
