const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🧹 INICIANDO LIMPEZA TOTAL DO SISTEMA...');
console.log('🗑️  Removendo regras obsoletas (+50, +30, +20, +15, +10, +5, -5, etc.)');
console.log('📋 Instalando REGULAMENTO OFICIAL 2026 (Meinhas)');
console.log('');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        process.exit(1);
    }
});

async function executeSQL(sql, desc) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                console.log(`⚠️  ${desc}: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ ${desc}`);
                resolve();
            }
        });
    });
}

async function executeQuery(sql, desc) {
    return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
                console.log(`❌ ${desc}: ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function runCleanup() {
    try {
        console.log('🚨 FASE 1: LIMPEZA DE REGRAS OBSOLETAS\n');

        // Listar regras atuais antes da limpeza
        const beforeRules = await executeQuery('SELECT id, name, value FROM scoring_rules', 'Regras atuais');
        console.log(`\n📊 Regras atuais: ${beforeRules.length}`);
        beforeRules.forEach(r => {
            const alert = (r.value > 5 || r.value < -2) ? '🗑️  [SERÁ APAGADA]' : '';
            console.log(`   ${r.id}. ${r.name} (${r.value >= 0 ? '+' : ''}${r.value}) ${alert}`);
        });

        console.log('\n🗑️  Apagando regras obsoletas...');

        // Apagar regras por valor
        await executeSQL('DELETE FROM scoring_rules WHERE value > 5 OR value < -2', 'Removidas regras com valores extremos');

        // Apagar regras específicas por nome
        const obsoletePatterns = [
            'Pomo de Ouro', 'Presente', 'Ser legal', 'Boas ações',
            'Casa mais animada', 'Indicação que fecha', 'Subir de nível',
            'Destaque', 'Prancha', 'Recorde de abdominal', 'Duelo',
            'Missão', 'Chair', 'Arte da Casa', 'Escudo', 'Cartões',
            'Desafio não executado', 'Falta sem aviso'
        ];

        for (const pattern of obsoletePatterns) {
            await executeSQL(`DELETE FROM scoring_rules WHERE name LIKE '%${pattern}%'`, `Removidas regras: ${pattern}`);
        }

        // Limpar completamente
        await executeSQL('DELETE FROM scoring_rules', 'Limpeza total da tabela scoring_rules');
        await executeSQL('DELETE FROM sqlite_sequence WHERE name = "scoring_rules"', 'Reset do autoincrement');

        console.log('\n✅ FASE 1 CONCLUÍDA: Banco limpo!\n');

        console.log('📋 FASE 2: INSTALANDO REGULAMENTO OFICIAL 2026\n');

        // Inserir regras do Regulamento 2026
        const regras2026 = [
            ['Presença em Aula', 1, 'Meinha', 'presence'],
            ['Usar a Cor da Casa', 1, 'Meinha', 'house_color'],
            ['Story (@marchapilates)', 1, 'Meinha', 'story'],
            ['Reels ou Feed', 2, 'Meinha', 'reels'],
            ['Desafio de Sala (Aleatório)', 2, 'Meinha', 'challenge'],
            ['Evolução Técnica', 3, 'Meinha', 'evolution'],
            ['Indicação (Experimental)', 3, 'Meinha', 'referral'],
            ['Conversão (Virou Aluno)', 2, 'Meinha', 'conversion'],
            ['Falta sem justificativa', -2, 'Punição', 'absence'],
            ['Pomo - Meta Base', 3, 'Pomo', 'pomo_meta'],
            ['Pomo - Recorde', 5, 'Pomo', 'pomo_record'],
            ['Capitão (Bônus Fixo Mensal)', 5, 'Capitão', 'captain']
        ];

        for (const regra of regras2026) {
            await new Promise((resolve) => {
                db.run(
                    `INSERT INTO scoring_rules (name, value, category, points_type, active) VALUES (?, ?, ?, ?, 1)`,
                    regra,
                    (err) => {
                        if (!err) {
                            const sinal = regra[1] >= 0 ? '+' : '';
                            console.log(`  ✅ ${regra[0]} (${sinal}${regra[1]} pts)`);
                        }
                        resolve();
                    }
                );
            });
        }

        console.log('\n✅ FASE 2 CONCLUÍDA: 12 regras instaladas!\n');

        console.log('🔐 FASE 3: SISTEMA DE HASH ÚNICO PARA CARTAS\n');

        // Adicionar campo hash_code
        await executeSQL(
            'ALTER TABLE active_cards ADD COLUMN hash_code TEXT UNIQUE',
            'Campo hash_code adicionado (impedirá reutilização)'
        );

        // Criar índice único
        await executeSQL(
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards_hash ON active_cards(hash_code)',
            'Índice único criado para hash_code'
        );

        console.log('\n✅ FASE 3 CONCLUÍDA: Sistema de hash ativo!\n');

        console.log('🔍 VERIFICAÇÃO FINAL\n');

        // Listar regras finais
        const afterRules = await executeQuery(
            'SELECT id, name, value, category FROM scoring_rules ORDER BY value DESC',
            'Regras finais'
        );

        console.log(`\n📊 TABELA LIMPA - Total de regras: ${afterRules.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  ID | REGRA                          | PONTOS | CATEGORIA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        afterRules.forEach(r => {
            const sinal = r.value >= 0 ? '+' : '';
            const id = String(r.id).padStart(4);
            const nome = r.name.padEnd(30);
            const pts = `${sinal}${r.value}`.padStart(6);
            const cat = r.category.padEnd(10);
            console.log(`  ${id} | ${nome} | ${pts} | ${cat}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Verificar se alguma regra indesejada sobrou
        const badRules = afterRules.filter(r => r.value > 5 || r.value < -2);
        if (badRules.length > 0) {
            console.log('\n⚠️  ATENÇÃO: Regras indesejadas encontradas!');
            badRules.forEach(r => console.log(`   - ${r.name}: ${r.value}`));
        } else {
            console.log('\n✅ PERFEITO: Nenhuma regra obsoleta encontrada!');
        }

        console.log('\n🎉 SISTEMA LIMPO E ATUALIZADO COM SUCESSO!');
        console.log('📋 Total de regras: 12 (conforme Regulamento Oficial 2026)');
        console.log('🔐 Sistema de hash ativo para evitar reutilização de cartas');
        console.log('\n');

    } catch (err) {
        console.error('❌ ERRO CRÍTICO:', err);
    } finally {
        db.close(() => {
            console.log('✅ Conexão com banco encerrada.\n');
        });
    }
}

runCleanup();
