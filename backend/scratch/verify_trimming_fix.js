const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../database.sqlite');

async function testImportLogic() {
    console.log('=== TESTE DE IMPORTAÇÃO ROBUSTA ===');

    // 1. Limpar logs e scores de teste anteriores se existirem (para o atleta BRUNA YOKOTA id=10043)
    const athleteId = 10043; // patient_id da Bruna
    
    // 2. Simular o processamento da rota (lógica interna simplificada baseada no index.js atualizado)
    const testCases = [
        { nome: 'BRUNA YOKOTA', pontos: 5, motivo: ' [+1 Ponto] Presença' },      // Espaço antes
        { nome: 'BRUNA YOKOTA', pontos: 3, motivo: '[+1 Ponto] Presença ' },      // Espaço depois
        { nome: 'BRUNA YOKOTA', pontos: 7, motivo: '  [+1 Ponto] Presença  ' },    // Ambos
        { nome: 'BRUNA YOKOTA', pontos: 10, motivo: 'Presença' },                 // Sem brackets (Deep match)
    ];

    for (const row of testCases) {
        const nome = (row.nome || '').trim();
        const motivo = (row.motivo || '').trim();
        const pontos = row.pontos;

        console.log(`\nTestando: "${row.motivo}"`);

        const ruleMatched = await queryGet("SELECT id, value FROM scoring_rules WHERE name = ? AND active = 1", [motivo]);
        let ruleToUse = ruleMatched;

        if (!ruleToUse) {
            console.log('  Level 1 (Exact) falhou. Tentando Level 2 (LIKE)...');
            ruleToUse = await queryGet("SELECT id, value FROM scoring_rules WHERE name LIKE ? AND active = 1 LIMIT 1", ["%" + motivo + "%"]);
        }

        if (!ruleToUse) {
            console.log('  Level 2 (LIKE) falhou. Tentando Level 3 (Deep)...');
            const cleaned = motivo.replace(/\[|\]/g, '');
            ruleToUse = await queryGet("SELECT id, value FROM scoring_rules WHERE name LIKE ? AND active = 1 LIMIT 1", ["%" + cleaned + "%"]);
        }

        const ruleId = ruleToUse ? ruleToUse.id : 99;
        console.log(`  Resultado: Rule ID ${ruleId} (${ruleToUse ? 'MATCH' : 'FALLBACK'})`);
        
        if (ruleId !== 1) {
            console.error(`  ❌ ERRO: Esperava ID 1, recebi ${ruleId}`);
        } else {
            console.log(`  ✅ SUCESSO: Mapeado corretamente para Presença!`);
        }
    }
}

function queryGet(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

testImportLogic().then(() => db.close());
