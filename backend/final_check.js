const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 VERIFICAÇÃO FINAL DO SISTEMA\n');

db.all('SELECT id, name, value, category FROM scoring_rules ORDER BY value DESC', (err, rows) => {
    if (err) {
        console.error('❌ Erro no banco:', err);
        return;
    }

    console.log('📋 LISTA DE REGRAS ATIVAS (Total: ' + rows.length + ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    rows.forEach(r => {
        const pts = (r.value >= 0 ? '+' : '') + r.value;
        console.log(`✅ ID ${r.id} | ${r.name.padEnd(30)} | ${pts} pts`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verificação de regras proibidas
    const proibidas = rows.filter(r =>
        r.value > 5 || r.value < -2 ||
        r.name.match(/ser legal|mascote|presente|pomo de ouro/i)
    );

    if (proibidas.length > 0) {
        console.log('\n❌ ERRO: REGRAS PROIBIDAS ENCONTRADAS!');
        proibidas.forEach(r => console.log(`   - ${r.name} (${r.value})`));
    } else {
        console.log('\n✅ SUCESSO: Nenhuma regra antiga encontrada.');
    }

    // Verificar Rota de Imagens
    const indexJs = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
    if (indexJs.includes("app.use('/api/cartas', express.static('C:/Marcha/cartas'))")) {
        console.log('✅ Rota de imagens configurada corretamente (/api/cartas)');
    } else {
        console.log('❌ ERRO: Rota de imagens não encontrada no código!');
    }

    // Verificar Bloqueio de Edição
    const regrasHtml = fs.readFileSync(path.join(__dirname, '../frontend/regras.html'), 'utf8');
    if (regrasHtml.includes('Edição Bloqueada')) {
        console.log('✅ Bloqueio de edição ativo em regras.html');
    } else {
        console.log('❌ ERRO: Formulário de nova regra ainda existe!');
    }

    db.close();
});
