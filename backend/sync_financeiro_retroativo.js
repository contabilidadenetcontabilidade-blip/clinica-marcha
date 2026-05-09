/**
 * Script de Sincronização Retroativa
 * Busca agendamentos 'realizado' de HOJE que não possuem transação financeira
 * e insere as transações faltantes.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error('Erro DB:', err.message); process.exit(1); }
    console.log('Conectado ao banco:', DB_PATH);
});

// Valores padrão por convênio
const INSURANCE_VALUES = {
    'Particular': 150.00,
    'Gympass': 22.20,
    'TotalPass': 22.00,
    'ClassPass': 22.00,
    'Outro': 120.00
};

const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

console.log(`\n📅 Buscando agendamentos "realizado" de ${today} sem registro financeiro...\n`);

const query = `
  SELECT a.id AS apt_id, a.patient_id, a.title, a.service_type, a.appointment_date,
         p.name AS patient_name, p.health_insurance
  FROM appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
  WHERE a.status IN ('realizado', 'confirmado')
    AND a.appointment_date = ?
    AND a.id NOT IN (SELECT appointment_id FROM financial_transactions WHERE appointment_id IS NOT NULL)
`;

db.all(query, [today], (err, rows) => {
    if (err) {
        console.error('Erro na query:', err.message);
        db.close();
        return;
    }

    if (!rows || rows.length === 0) {
        console.log('✅ Nenhum agendamento "realizado" de hoje sem registro financeiro. Tudo sincronizado!');
        db.close();
        return;
    }

    console.log(`⚠️  Encontrados ${rows.length} agendamento(s) sem transação financeira:\n`);

    let inserted = 0;
    let errors = 0;

    rows.forEach((row, idx) => {
        const convenio = row.health_insurance || '';
        const valor = INSURANCE_VALUES[convenio] || INSURANCE_VALUES['Particular']; // Default: Particular
        const desc = `${row.service_type || 'Procedimento'} - ${row.patient_name || 'Paciente'} (${row.title})`;

        console.log(`  ${idx + 1}. [${row.apt_id}] ${row.patient_name} | ${convenio || 'Sem convênio'} | R$${valor.toFixed(2)} | "${row.title}"`);

        db.run(
            `INSERT INTO financial_transactions (type, category, description, amount, due_date, payment_date, payment_method, patient_id, appointment_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['receita', row.service_type || 'consulta', desc, valor,
                row.appointment_date, row.appointment_date, convenio || null,
                row.patient_id, row.apt_id, `Sync retroativo | Convênio: ${convenio || 'N/A'}`],
            function (fErr) {
                if (fErr) {
                    console.error(`  ❌ ERRO apt_id=${row.apt_id}: ${fErr.message}`);
                    errors++;
                } else {
                    console.log(`  ✅ Transação #${this.lastID} inserida para apt_id=${row.apt_id}`);
                    inserted++;
                }

                // Fecha DB quando terminar todos
                if (inserted + errors >= rows.length) {
                    console.log(`\n═══ RESULTADO: ${inserted} inserida(s) | ${errors} erro(s) ═══`);
                    db.close();
                }
            }
        );
    });
});
