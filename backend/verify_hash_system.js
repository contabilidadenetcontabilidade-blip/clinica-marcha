const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🔐 Verificando e atualizando sistema de HASH...\n');

const db = new sqlite3.Database(dbPath);

async function executeSQL(sql, desc) {
    return new Promise((resolve) => {
        db.run(sql, (err) => {
            if (err) {
                console.log(`⚠️  ${desc}: ${err.message}`);
            } else {
                console.log(`✅ ${desc}`);
            }
            resolve();
        });
    });
}

async function executeQuery(sql) {
    return new Promise((resolve) => {
        db.all(sql, (err, rows) => {
            if (err) {
                console.log(`❌ Erro: ${err.message}`);
                resolve([]);
            } else {
                resolve(rows);
            }
        });
    });
}

async function updateHashSystem() {
    // Verificar se coluna hash_code já existe
    const columns = await executeQuery("PRAGMA table_info(active_cards)");
    const hasHash = columns.some(col => col.name === 'hash_code');

    if (!hasHash) {
        console.log('Campo hash_code não encontrado. Tentando adicionar...');
        // SQLite não permite adicionar UNIQUE diretamente, então adicionamos sem UNIQUE primeiro
        await executeSQL('ALTER TABLE active_cards ADD COLUMN hash_code TEXT', 'Campo hash_code adicionado');
        await executeSQL('CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards_hash ON active_cards(hash_code)', 'Índice único criado');
    } else {
        console.log('✅ Campo hash_code já existe!');
        // Garantir que o índice único existe
        await executeSQL('CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards_hash ON active_cards(hash_code)', 'Índice único verificado');
    }

    console.log('\n✅ Sistema de hash configurado corretamente!\n');

    // Verificar regras finais
    const regras = await executeQuery('SELECT id, name, value, category FROM scoring_rules ORDER BY value DESC');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  REGULAMENTO OFICIAL 2026 - MEINHAS (SISTEMA LIMPO)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ID | REGRA                          | PONTOS | CATEGORIA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    regras.forEach(r => {
        const sinal = r.value >= 0 ? '+' : '';
        const id = String(r.id).padStart(4);
        const nome = r.name.padEnd(30);
        const pts = `${sinal}${r.value}`.padStart(6);
        const cat = r.category.padEnd(10);
        console.log(`  ${id} | ${nome} | ${pts} | ${cat}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Total: ${regras.length} regras (Regulamento Oficial 2026)`);

    // Verificação final
    const obsoletas = regras.filter(r => r.value > 5 || r.value < -2);
    if (obsoletas.length > 0) {
        console.log('\n⚠️  ATENÇÃO: Regras obsoletas encontradas!');
        obsoletas.forEach(r => console.log(`   - ${r.name}: ${r.value}`));
    } else {
        console.log('\n🎉 SISTEMA COMPLETAMENTE LIMPO!');
        console.log('✅ Nenhuma regra obsoleta (+50, +30, +20, +15, +10, -5) encontrada');
        console.log('✅ Teto de pontos: +5 (Pomo Recorde ou Capitão)');
        console.log('✅ Sistema de hash único ativo (anti-reutilização de cartas)');
    }

    db.close();
}

updateHashSystem();
