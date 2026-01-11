require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('./db');

const app = express();
const port = process.env.PORT || 8080;

app.get('/api/version', (req, res) => {
  res.json({ version: 'v9', timestamp: new Date().toString(), env: process.env.NODE_ENV });
});

app.get('/api/ls-frontend', (req, res) => {
  const dir = path.join(__dirname, '../frontend');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message, path: dir });
    res.json({ path: dir, files: files });
  });
});

console.log("SERVER STARTING - REVISION V9");
console.log("DB HOST:", process.env.PGHOST || "N/A");
console.log("INSTANCE:", process.env.INSTANCE_CONNECTION_NAME || "N/A");

// Serve arquivos estáticos do frontendBÁSICOS ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// DEBUG: Forçar servimento do agenda.html
app.get('/agenda.html', (req, res) => {
  const file = path.join(__dirname, '../frontend/agenda.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send('Agenda file not found on server');
    // Log files to debug
    fs.readdir(path.join(__dirname, '../frontend'), (err, files) => {
      console.log("DEBUG FRONTEND DIR:", files);
    });
  }
});

// --------- UPLOAD CONFIG ----------
// Ensure directories exist
// Ensure directories exist
const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(path.join(assetsDir, 'houses'))) fs.mkdirSync(path.join(assetsDir, 'houses'), { recursive: true });
if (!fs.existsSync(path.join(assetsDir, 'patients'))) fs.mkdirSync(path.join(assetsDir, 'patients'), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../assets/houses')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png')
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.png')) return cb(new Error('Apenas PNG!'));
    cb(null, true);
  }
});

const storagePatients = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../assets/patients')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const uploadPatients = multer({
  storage: storagePatients,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens!'));
    cb(null, true);
  }
});

// =============== AUTH & LOGIN ==================

// Inicializa Admin
(async () => {
  try {
    const res = await pool.query("SELECT id FROM patients WHERE role = 'admin'");
    if (res.rowCount === 0) {
      console.log("Criando usuário admin (Tamara)...");
      await pool.query(
        "INSERT INTO patients (name, type, role, password, email, username) VALUES ($1, $2, $3, $4, $5, $6)",
        ['Tamara', 'Admin', 'admin', 'admin', 'tamara@marcha.com.br', 'Tamara']
      );
    }

    // Seed Student for Validation
    const resVal = await pool.query("SELECT id FROM patients WHERE username = 'aluno.flow2'");
    if (resVal.rowCount === 0) {
      console.log("Criando aluno de teste (Aluno Flow 2)...");
      const p = await pool.query(
        "INSERT INTO patients (name, type, role, password, username) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ['Aluno Flow 2', 'Aluno', 'aluno', '123', 'aluno.flow2']
      );
      // Link to House Reformer (Assuming ID 1 is Reformer? Or check name)
      // We need houses first.
      const hRes = await pool.query("SELECT id FROM houses WHERE name = 'Reformer'");
      if (hRes.rowCount > 0) {
        await pool.query("INSERT INTO athletes (name, house_id, patient_id) VALUES ($1, $2, $3)",
          ['Aluno Flow 2', hRes.rows[0].id, p.rows[0].id]);
      }
    }

    // Seed Physio for Validation
    const resFisio = await pool.query("SELECT id FROM patients WHERE username = 'fisioteste'");
    if (resFisio.rowCount === 0) {
      console.log("Criando fisioterapeuta de teste (Fisio Teste)...");
      await pool.query(
        "INSERT INTO patients (name, type, role, password, username, email) VALUES ($1, $2, $3, $4, $5, $6)",
        ['Fisio Teste', 'Profissional', 'fisio', '123', 'fisioteste', 'fisio@marcha.com.br']
      );
    }
  } catch (e) {
    console.error("Erro na verificação de admin:", e);
  }
})();

// Health Check do Banco de Dados
app.get('/api/db-check', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    res.json({
      status: 'ok',
      connection: 'success',
      tables: result.rows.map(r => r.table_name)
    });
  } catch (err) {
    console.error("Health Check Falhou:", err);
    res.status(500).json({
      status: 'error',
      message: err.message,
      detail: 'Falha ao conectar ou listar tabelas'
    });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Obrigatório usuário e senha" });

  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE (username = $1 OR name = $1 OR email = $1 OR cpf = $1) AND password = $2",
      [username, password]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    res.json({
      id: user.id,
      name: user.name,
      role: user.role || 'aluno',
      type: user.type,
      photo: user.photo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// =============== STUDENT PORTAL ==================
app.get('/api/student-portal/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const pRes = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    const patient = pRes.rows[0];

    if (!patient) return res.status(404).json({ error: "Aluno não encontrado" });

    const aRes = await pool.query("SELECT * FROM athletes WHERE name = $1", [patient.name]);
    const athlete = aRes.rows[0];

    if (!athlete) {
      return res.json({ patient, athlete: null, house: null, scores: [], ranking: [] });
    }

    const hRes = await pool.query("SELECT * FROM houses WHERE id = $1", [athlete.house_id]);
    const house = hRes.rows[0];

    const sRes = await pool.query(`
            SELECT s.*, r.name as rule_name, r.value 
            FROM scores s 
            JOIN scoring_rules r ON s.rule_id = r.id 
            WHERE s.athlete_id = $1 ORDER BY s.id DESC
        `, [athlete.id]);
    const scores = sRes.rows;

    const totalScore = scores.reduce((acc, curr) => acc + curr.value, 0);

    const rRes = await pool.query(`
            SELECT h.name, COALESCE(SUM(sr.value), 0) as total_points
            FROM houses h
            LEFT JOIN athletes a ON a.house_id = h.id
            LEFT JOIN scores s ON s.athlete_id = a.id
            LEFT JOIN scoring_rules sr ON s.rule_id = sr.id
            WHERE h.active = 1
            GROUP BY h.id, h.name
            ORDER BY total_points DESC
        `);

    res.json({
      patient,
      athlete: { ...athlete, totalScore },
      house,
      scores,
      ranking: rRes.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =============== HOUSES ==================
app.get('/api/houses', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, color, crest, active FROM houses WHERE active = 1 ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ranking', async (req, res) => {
  try {
    const rRes = await pool.query(`
            SELECT h.id, h.name, h.color, h.crest, COALESCE(SUM(sr.value), 0) as total_points
            FROM houses h
            LEFT JOIN athletes a ON a.house_id = h.id
            LEFT JOIN scores s ON s.athlete_id = a.id
            LEFT JOIN scoring_rules sr ON s.rule_id = sr.id
            WHERE h.active = 1
            GROUP BY h.id, h.name, h.color, h.crest
            ORDER BY total_points DESC, h.name ASC
        `);
    res.json(rRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/houses', upload.single('crest'), async (req, res) => {
  const { name, color } = req.body;
  const crest = req.file ? `/assets/houses/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      "INSERT INTO houses (name, color, crest) VALUES ($1, $2, $3) RETURNING id",
      [name, color, crest]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/houses/:id/dashboard', async (req, res) => {
  const houseId = req.params.id;
  try {
    const hRes = await pool.query("SELECT * FROM houses WHERE id = $1", [houseId]);
    const house = hRes.rows[0];
    if (!house) return res.status(404).json({ error: "Not found" });

    const tRes = await pool.query(`
            SELECT COALESCE(SUM(sr.value), 0) AS total_points
            FROM scores sc
            JOIN scoring_rules sr ON sc.rule_id = sr.id
            JOIN athletes a ON sc.athlete_id = a.id
            WHERE a.house_id = $1
        `, [houseId]);

    const athletesRes = await pool.query(`
            SELECT a.id, a.name, COALESCE(SUM(sr.value), 0) AS total_points
            FROM athletes a
            LEFT JOIN scores sc ON sc.athlete_id = a.id
            LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
            WHERE a.house_id = $1
            GROUP BY a.id, a.name
            ORDER BY total_points DESC, a.name ASC
        `, [houseId]);

    res.json({
      house,
      totalPoints: tRes.rows[0].total_points,
      athletes: athletesRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== PATIENTS (LISTA BLINDADA) ==================
app.get('/api/patients', async (req, res) => {
  const { active } = req.query;
  // FILTRO RIGOROSO: Apenas ALUNO ou CLIENTE
  // FILTRO RIGOROSO: Apenas ALUNO ou CLIENTE
  let sql = `
    SELECT p.*, a.house_id 
    FROM patients p 
    LEFT JOIN athletes a ON a.patient_id = p.id OR (a.patient_id IS NULL AND a.name = p.name)
    WHERE p.role IN ('aluno', 'cliente', 'ALUNO', 'CLIENTE')
  `;
  const params = [];

  if (active) {
    params.push(1);
    sql += " AND p.active = $1";
  }

  sql += " ORDER BY p.name ASC";

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', uploadPatients.single('photo'), async (req, res) => {
  const { name, cpf, phone, email, birth_date, type, role, password } = req.body;
  const photo = req.file ? `/assets/patients/${req.file.filename}` : null;

  try {
    const result = await pool.query(`
            INSERT INTO patients (name, cpf, phone, email, birth_date, type, role, password, photo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
        `, [name, cpf, phone, email, birth_date, type || 'Paciente', role || 'aluno', password, photo]);

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', uploadPatients.single('photo'), async (req, res) => {
  const id = req.params.id;
  const { name, phone, email, type, role, password, active } = req.body;

  // Dynamic Update
  // Simplification for migration speed: Update main fields
  try {
    let photoPath = null;
    if (req.file) photoPath = `/assets/patients/${req.file.filename}`;

    // This is a simplified update to ensure core fields work. 
    // Ideally we build the query dynamically.
    const result = await pool.query(`
            UPDATE patients SET 
              name = COALESCE($1, name),
              phone = COALESCE($2, phone),
              email = COALESCE($3, email),
              type = COALESCE($4, type),
              role = COALESCE($5, role),
              password = COALESCE($6, password),
              active = COALESCE($7, active),
              photo = COALESCE($8, photo),
              username = COALESCE($9, username),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
        `, [name, phone, email, type, role, password, active, photoPath, req.body.username, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await pool.query("UPDATE patients SET active = 0 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id/house', async (req, res) => {
  const patientId = req.params.id;
  const { house_id } = req.body;

  try {
    // 1. Get Patient Name
    const pRes = await pool.query("SELECT name FROM patients WHERE id = $1", [patientId]);
    if (pRes.rowCount === 0) return res.status(404).json({ error: "Aluno não encontrado" });
    const patientName = pRes.rows[0].name;

    // 2. Check if Athlete exists
    let aRes = await pool.query("SELECT id FROM athletes WHERE patient_id = $1", [patientId]);

    // Fallback: Check by name (migration support)
    if (aRes.rowCount === 0) {
      aRes = await pool.query("SELECT id FROM athletes WHERE name = $1", [patientName]);
      // If found by name, we should link it now
      if (aRes.rowCount > 0) {
        await pool.query("UPDATE athletes SET patient_id = $1 WHERE id = $2", [patientId, aRes.rows[0].id]);
      }
    }

    if (aRes.rowCount > 0) {
      // Update existing
      await pool.query("UPDATE athletes SET house_id = $1 WHERE id = $2", [house_id, aRes.rows[0].id]);
    } else {
      // Create new
      await pool.query("INSERT INTO athletes (name, house_id, patient_id) VALUES ($1, $2, $3)",
        [patientName, house_id, patientId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEBUG DE AGENDAMENTOS
app.get('/api/debug-appointments', async (req, res) => {
  try {
    let seedResult = false;

    // Seed de Emergência
    if (req.query.seed === 'true') {
      console.log("Criando agendamento de teste...");
      // Pega o primeiro paciente (provavelmente Tamara)
      const pRes = await pool.query("SELECT id FROM patients LIMIT 1");
      if (pRes.rows.length > 0) {
        await pool.query(`
            INSERT INTO appointments (patient_id, title, appointment_date, start_time, service_type, status)
            VALUES ($1, 'Teste de Debug', CURRENT_DATE, '14:00:00', 'Avaliação', 'pendente')
         `, [pRes.rows[0].id]);
        seedResult = true;
      }
    }

    // Listagem Geral
    const result = await pool.query(`
        SELECT a.id, a.title, a.appointment_date, a.start_time, p.name as patient_name 
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        ORDER BY a.appointment_date DESC LIMIT 50
    `);

    res.json({
      msg: "Lista de Agendamentos (Raw)",
      count: result.rows.length,
      seed_created: seedResult,
      rows: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEBUG DE DIAGNÓSTICO (Count & Config)
app.get('/api/diagnosis', async (req, res) => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM appointments");
    const sampleRes = await pool.query("SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5");

    res.json({
      status: 'ok',
      count: countRes.rows[0].count,
      server_time: new Date().toString(),
      samples: sampleRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== APPOINTMENTS ==================
app.get('/api/appointments', async (req, res) => {
  const { date, start_date, end_date } = req.query;
  let sql = `
        SELECT a.*, p.name as patient_name, p.phone as patient_phone
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        WHERE 1=1
    `;
  const params = [];

  if (date) {
    params.push(date);
    // FIX: Cast para date previne erros se o banco tiver timestamp
    sql += ` AND a.appointment_date::date = $${params.length}::date`;
  } else if (start_date && end_date) {
    params.push(start_date, end_date);
    // FIX: Range com cast
    sql += ` AND a.appointment_date::date BETWEEN $${params.length - 1}::date AND $${params.length}::date`;
  }

  sql += " ORDER BY a.appointment_date ASC, a.start_time ASC";

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { patient_id, title, appointment_date, start_time, service_type, price, recurrence } = req.body;

  // Use price from body or default to 100 if null
  const amount = price !== undefined ? price : 100.00;

  try {
    const datesToCreate = [appointment_date];

    // Continuous Recurrence Logic (12 weeks)
    if (recurrence === 'continuous') {
      const baseDate = new Date(appointment_date);
      for (let i = 1; i < 12; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i * 7));
        datesToCreate.push(nextDate.toISOString().split('T')[0]);
      }
    }

    const createdIds = [];

    for (const dt of datesToCreate) {
      const result = await pool.query(`
            INSERT INTO appointments (patient_id, title, appointment_date, start_time, service_type)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [patient_id, title, dt, start_time, service_type]);

      const appId = result.rows[0].id;
      createdIds.push(appId);

      // Auto-create Financial
      await pool.query(`
            INSERT INTO financial_transactions (type, category, description, amount, due_date, patient_id, appointment_id, created_at)
            VALUES ('receita', 'consulta', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [`${service_type} - ${title}`, amount, dt, patient_id, appId]);
    }

    res.json({ id: createdIds[0], count: createdIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments/:id/confirm', async (req, res) => {
  const id = req.params.id;
  const { status, amount } = req.body; // status can be 'realizado' or 'faltou'

  try {
    await pool.query("BEGIN");

    // Update Status
    const newStatus = status || 'realizado';
    await pool.query("UPDATE appointments SET status = $1 WHERE id = $2", [newStatus, id]);

    // Handle Financials
    if (newStatus === 'realizado') {
      // Confirm payment
      // If amount was edited in confirmation modal, update it? 
      // For now, simpler to just set payment date. Logic can be improved to update amount.
      if (amount) {
        await pool.query("UPDATE financial_transactions SET payment_date = CURRENT_DATE, amount = $1 WHERE appointment_id = $2", [amount, id]);
      } else {
        await pool.query("UPDATE financial_transactions SET payment_date = CURRENT_DATE WHERE appointment_id = $1", [id]);
      }

      // --- GAMIFICATION SCORING (MARCHA CUP) ---
      // 1. Get Patient ID from appointment
      const appRes = await pool.query("SELECT patient_id FROM appointments WHERE id = $1", [id]);
      if (appRes.rowCount > 0) {
        const pid = appRes.rows[0].patient_id;
        // 2. Check if Athlete
        const athRes = await pool.query("SELECT id FROM athletes WHERE patient_id = $1", [pid]);
        if (athRes.rowCount > 0) {
          // 3. Add Score (Rule 1 = Presença = 10pts)
          // Assuming Rule ID 1 exists and is for "Presença"
          // Ideally look up rule by name 'Presença'
          const rRes = await pool.query("SELECT id FROM scoring_rules WHERE name = 'Presença' LIMIT 1");
          let ruleId = rRes.rowCount > 0 ? rRes.rows[0].id : null;

          // If rule doesn't exist, create it? Or skip.
          if (!ruleId) {
            const nr = await pool.query("INSERT INTO scoring_rules (name, value) VALUES ('Presença', 10) RETURNING id");
            ruleId = nr.rows[0].id;
          }

          await pool.query("INSERT INTO scores (athlete_id, rule_id) VALUES ($1, $2)", [athRes.rows[0].id, ruleId]);
        }
      }
      // ----------------------------------------

    } else if (newStatus === 'faltou') {
      // If absent, do we delete the financial record? Or leave it as 'pendente'?
      // Usually absence might charge or not. User didn't specify.
      // Let's assume 'faltou' means NO REVENUE confirmed yet. It stays open or cancelled?
      // Let's keep it pending so admin can decide to delete or charge later.
      // Or if strictly 'faltou' = loss of revenue?
      // Safest: Do nothing to finance, just update status.
    }

    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== FINANCIAL ==================
app.get('/api/financial', async (req, res) => {
  const { type, start_date, end_date } = req.query;
  let sql = `
        SELECT f.*, p.name as patient_name 
        FROM financial_transactions f
        LEFT JOIN patients p ON f.patient_id = p.id
        WHERE 1=1
    `;
  const params = [];

  if (type) {
    params.push(type);
    sql += ` AND f.type = $${params.length}`;
  }
  if (start_date && end_date) {
    params.push(start_date, end_date);
    sql += ` AND f.due_date BETWEEN $${params.length - 1} AND $${params.length}`;
  }

  sql += " ORDER BY f.due_date DESC";

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financial/summary', async (req, res) => {
  const { start_date, end_date } = req.query;

  // Security Check
  if (req.headers['x-user-role'] !== 'admin') {
    return res.status(403).json({ error: "Acesso Negado: Apenas Administradores" });
  }

  let where = "WHERE 1=1";
  const params = [];

  if (start_date && end_date) {
    params.push(start_date, end_date);
    where += ` AND due_date BETWEEN $1 AND $2`;
  }

  try {
    const result = await pool.query(`
            SELECT 
                type, 
                SUM(amount) as total,
                SUM(CASE WHEN payment_date IS NOT NULL THEN amount ELSE 0 END) as paid_total
            FROM financial_transactions
            ${where}
            GROUP BY type
        `, params);

    const summary = {
      receitas: { total: 0, paid: 0 },
      despesas: { total: 0, paid: 0 }
    };

    result.rows.forEach(r => {
      if (r.type === 'receita') {
        summary.receitas.total = parseFloat(r.total);
        summary.receitas.paid = parseFloat(r.paid_total);
      } else {
        summary.despesas.total = parseFloat(r.total);
        summary.despesas.paid = parseFloat(r.paid_total);
      }
    });

    summary.balance = summary.receitas.total - summary.despesas.total; // Simplificado
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financial', async (req, res) => {
  const { type, description, amount, due_date, category, patient_id } = req.body;
  try {
    const result = await pool.query(`
            INSERT INTO financial_transactions (type, description, amount, due_date, category, patient_id)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `, [type, description, amount, due_date, category, patient_id]);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/financial/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM financial_transactions WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== DASHBOARD (BLINDADO) ==================
app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. Clientes Ativos (BLINDAGEM: Apenas ALUNO ou CLIENTE)
    // FIX: Using correct query structure seen in patients filters or simplistic count
    const p1 = pool.query("SELECT COUNT(*) as count FROM patients WHERE active = 1 AND role IN ('aluno', 'cliente', 'ALUNO', 'CLIENTE')");

    // Auth Check
    const userRole = req.headers['x-user-role'];
    const isAdmin = userRole === 'admin';

    // 2. Receita Mês (ONLY ADMIN)
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const p2 = isAdmin
      ? pool.query("SELECT SUM(amount) as total FROM financial_transactions WHERE type='receita' AND payment_date BETWEEN $1 AND $2", [start, end])
      : Promise.resolve({ rows: [{ total: 0 }] }); // Fake result for non-admins

    // 3. Despesas Mês (ONLY ADMIN)
    const p3 = isAdmin
      ? pool.query("SELECT SUM(amount) as total FROM financial_transactions WHERE type='despesa' AND due_date BETWEEN $1 AND $2", [start, end])
      : Promise.resolve({ rows: [{ total: 0 }] });

    // 4. Agendamentos
    const p4 = pool.query("SELECT service_type, COUNT(*) as count FROM appointments WHERE appointment_date BETWEEN $1 AND $2 GROUP BY service_type", [start, end]);

    const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

    res.json({
      activePatients: parseInt(r1.rows[0].count),
      income: parseFloat(r2.rows[0].total || 0),
      expenses: parseFloat(r3.rows[0].total || 0),
      appointments: r4.rows,
      leader: { name: 'Em Breve', total_score: 0 } // Placeholder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// =============== PROFESSIONALS (NEW ROUTE) ==================
app.get('/api/professionals', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patients WHERE role IN ('fisio', 'admin', 'prof') OR type = 'Fisioterapeuta' ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== HOUSE GALLERY (NEW ROUTES) ==================
app.get('/api/houses/:id/photos', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM house_photos WHERE house_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/houses/:id/photos', uploadPatients.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const photoUrl = `/assets/patients/${req.file.filename}`;
    await pool.query("INSERT INTO house_photos (house_id, photo_url) VALUES ($1, $2)", [req.params.id, photoUrl]);
    res.json({ success: true, url: photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/houses/photos/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM house_photos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============== INVITE SYSTEM (NEW) ==================
const crypto = require('crypto');

app.post('/api/invites', async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query("INSERT INTO invite_tokens (token, expires_at) VALUES ($1, $2)", [token, expiresAt]);
    res.json({ token, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invites/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query("SELECT * FROM invite_tokens WHERE token = $1 AND is_active = TRUE", [token]);

    if (result.rowCount === 0) return res.status(404).json({ valid: false, message: 'Link inválido' });

    const invite = result.rows[0];
    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ valid: false, message: 'Link expirado' });
    }

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/public/register', async (req, res) => {
  const { token, name, phone } = req.body;

  try {
    // Validate Token
    const invRes = await pool.query("SELECT * FROM invite_tokens WHERE token = $1 AND is_active = TRUE", [token]);
    if (invRes.rowCount === 0) return res.status(400).json({ error: "Link inválido" });

    const invite = invRes.rows[0];
    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ error: "Link expirado" });
    }

    // Create Patient
    const result = await pool.query(`
            INSERT INTO patients (name, phone, type, role, active, created_at)
            VALUES ($1, $2, 'Cliente', 'cliente', 1, CURRENT_TIMESTAMP) RETURNING id
        `, [name, phone]);

    // Invalidate Token? No, user implied singular link generation but multiple uses? 
    // "Toda vez que ela clicar, um novo token...". Usually invite links are unique per user OR generic.
    // If it's for "a new client", usually unique. If multiple use, keep it. 
    // User said: "onde ele preencherá... e os dados deste cliente aparecerá". 
    // User also said: "Link de Cadastro (24h)". Usually implies a generic link valid for 24h for ANYONE.
    // If it was one-time, I'd invalidate it. I'll keep it valid for 24h for simplicity/generic usage unless specified.

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
