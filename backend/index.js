require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// --------- MIDDLEWARES BÁSICOS ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// --------- UPLOAD CONFIG ----------
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
        "INSERT INTO patients (name, type, role, password, email) VALUES ($1, $2, $3, $4, $5)",
        ['Tamara', 'Admin', 'admin', 'admin', 'tamara@marcha.com.br']
      );
    }
  } catch (e) {
    console.error("Erro na verificação de admin:", e);
  }
})();

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Obrigatório usuário e senha" });

  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE (name = $1 OR email = $1 OR cpf = $1) AND password = $2",
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
  let sql = "SELECT * FROM patients WHERE role IN ('aluno', 'cliente', 'ALUNO', 'CLIENTE')";
  const params = [];

  if (active) {
    params.push(1);
    sql += " AND active = $1";
  }

  sql += " ORDER BY name ASC";

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
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
        `, [name, phone, email, type, role, password, active, photoPath, id]);

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

// =============== APPOINTMENTS ==================
app.get('/api/appointments', async (req, res) => {
  const { date, start_date, end_date } = req.query;
  let sql = `
        SELECT a.*, p.name as patient_name 
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        WHERE 1=1
    `;
  const params = [];

  if (date) {
    params.push(date);
    sql += ` AND a.appointment_date = $${params.length}`;
  } else if (start_date && end_date) {
    params.push(start_date, end_date);
    sql += ` AND a.appointment_date BETWEEN $${params.length - 1} AND $${params.length}`;
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
  const { patient_id, title, appointment_date, start_time, service_type } = req.body;
  try {
    const result = await pool.query(`
            INSERT INTO appointments (patient_id, title, appointment_date, start_time, service_type)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [patient_id, title, appointment_date, start_time, service_type]);

    // Auto-create Financial (Simple Logic)
    await pool.query(`
            INSERT INTO financial_transactions (type, category, description, amount, due_date, patient_id, appointment_id, created_at)
            VALUES ('receita', 'consulta', $1, 100.00, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [`Aula ${title}`, appointment_date, patient_id, result.rows[0].id]);

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments/:id/confirm', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query("BEGIN");
    await pool.query("UPDATE appointments SET status = 'realizado' WHERE id = $1", [id]);
    await pool.query("UPDATE financial_transactions SET payment_date = CURRENT_DATE WHERE appointment_id = $1", [id]);
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
    const p1 = pool.query("SELECT COUNT(*) as count FROM patients WHERE active = 1 AND role IN ('aluno', 'cliente', 'ALUNO', 'CLIENTE')");

    // 2. Receita Mês
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const p2 = pool.query("SELECT SUM(amount) as total FROM financial_transactions WHERE type='receita' AND payment_date BETWEEN $1 AND $2", [start, end]);

    // 3. Despesas Mês
    const p3 = pool.query("SELECT SUM(amount) as total FROM financial_transactions WHERE type='despesa' AND due_date BETWEEN $1 AND $2", [start, end]);

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


app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
