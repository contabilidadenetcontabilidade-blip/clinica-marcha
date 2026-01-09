const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = 3000;

// --------- MIDDLEWARES BÁSICOS ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// --------- UPLOAD DE BRASÕES ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../assets/houses'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '.png');
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.toLowerCase().endsWith('.png')) {
      return cb(new Error('Upload permitido apenas para PNG!'));
    }
    // Verifica se o arquivo é realmente uma imagem PNG
    if (!file.mimetype || file.mimetype !== 'image/png') {
      return cb(new Error('Arquivo deve ser uma imagem PNG válida!'));
    }
    cb(null, true);
  }
});

// =============== CASAS ==================

// Listar casas ativas (sem totais ainda)
app.get('/api/houses', (req, res) => {
  console.log('GET /api/houses (lista simples)');
  db.all(
    "SELECT id, name, color, crest, active FROM houses WHERE active = 1 ORDER BY name ASC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Erro ao buscar casas:", err);
        return res.status(500).json({ error: "Erro ao buscar casas" });
      }
      res.json(rows || []);
    }
  );
});


// Criar nova casa
app.post('/api/houses', upload.single('crest'), (req, res) => {
  console.log('POST /api/houses');
  const { name, color } = req.body;
  
  // Validação de erro do multer
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  const crest = req.file ? `/assets/houses/${req.file.filename}` : null;

  // Sanitização básica
  const sanitizedName = (name || '').trim();
  if (!sanitizedName || sanitizedName.length === 0 || sanitizedName.length > 100) {
    // Remove arquivo se houver
    if (req.file) {
      const filePath = path.join(__dirname, '../assets/houses', req.file.filename);
      fs.unlink(filePath, () => {});
    }
    return res.status(400).json({ error: "Nome inválido" });
  }
  
  // Valida formato de cor (hex)
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    if (req.file) {
      const filePath = path.join(__dirname, '../assets/houses', req.file.filename);
      fs.unlink(filePath, () => {});
    }
    return res.status(400).json({ error: "Cor inválida (formato: #RRGGBB)" });
  }

  db.run(
    "INSERT INTO houses (name, color, crest) VALUES (?, ?, ?)",
    [sanitizedName, color, crest],
    function (err) {
      if (err) {
        console.error("Erro ao inserir casa:", err);
        // Remove arquivo se houver erro no banco
        if (req.file) {
          const filePath = path.join(__dirname, '../assets/houses', req.file.filename);
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Erro ao remover arquivo:", unlinkErr);
          });
        }
        return res.status(500).json({ error: "Erro ao salvar casa" });
      }
      res.json({ id: this.lastID });
    }
  );
});


// Buscar uma casa específica
app.get('/api/houses/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM houses WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar casa:", err);
      return res.status(500).json({ error: "Erro ao buscar casa" });
    }
    if (!row) return res.status(404).json({ error: "Casa não encontrada" });
    res.json(row);
  });
});

// Dashboard da casa: total, ranking atletas, melhor categoria
app.get('/api/houses/:id/dashboard', (req, res) => {
  const houseId = req.params.id;

  db.get("SELECT * FROM houses WHERE id = ?", [houseId], (err, house) => {
    if (err) {
      console.error("Erro ao buscar casa:", err);
      return res.status(500).json({ error: "Erro ao buscar casa" });
    }
    if (!house) return res.status(404).json({ error: "Casa não encontrada" });

    const totalQuery = `
      SELECT COALESCE(SUM(sr.value), 0) AS total_points
      FROM scores sc
      JOIN scoring_rules sr ON sc.rule_id = sr.id
      JOIN athletes a ON sc.athlete_id = a.id
      WHERE a.house_id = ?
    `;

    const athletesQuery = `
      SELECT a.id, a.name,
             COALESCE(SUM(sr.value), 0) AS total_points
      FROM athletes a
      LEFT JOIN scores sc ON sc.athlete_id = a.id
      LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
      WHERE a.house_id = ?
      GROUP BY a.id, a.name
      ORDER BY total_points DESC, a.name ASC
    `;

    const bestCategoryQuery = `
      SELECT sr.id, sr.name,
             COALESCE(SUM(sr.value), 0) AS total_points
      FROM scores sc
      JOIN scoring_rules sr ON sc.rule_id = sr.id
      JOIN athletes a ON sc.athlete_id = a.id
      WHERE a.house_id = ?
      GROUP BY sr.id, sr.name
      ORDER BY total_points DESC
      LIMIT 1
    `;

    db.get(totalQuery, [houseId], (err, totalRow) => {
      if (err) {
        console.error("Erro total pontos:", err);
        return res.status(500).json({ error: "Erro ao calcular total" });
      }
      const totalPoints = totalRow ? totalRow.total_points : 0;

      db.all(athletesQuery, [houseId], (err, athletes) => {
        if (err) {
          console.error("Erro ranking atletas:", err);
          return res.status(500).json({ error: "Erro ao carregar atletas" });
        }

        db.get(bestCategoryQuery, [houseId], (err, best) => {
          if (err) {
            console.error("Erro melhor categoria:", err);
            return res.status(500).json({ error: "Erro ao calcular categoria" });
          }

          res.json({
            house,
            totalPoints,
            bestCategory: best || null,
            athletes: athletes || []
          });
        });
      });
    });
  });
});

// =============== ATLETAS ==================

app.post('/api/athletes', (req, res) => {
  const { name, house_id } = req.body;
  if (!name || !house_id) {
    return res.status(400).json({ error: "Nome e casa são obrigatórios" });
  }
  
  // Sanitização básica: remove espaços extras e valida nome
  const sanitizedName = (name || '').trim();
  if (sanitizedName.length === 0 || sanitizedName.length > 200) {
    return res.status(400).json({ error: "Nome inválido" });
  }
  
  // Valida house_id é um número
  const houseIdNum = parseInt(house_id, 10);
  if (isNaN(houseIdNum) || houseIdNum <= 0) {
    return res.status(400).json({ error: "ID da casa inválido" });
  }

  db.run(
    "INSERT INTO athletes (name, house_id) VALUES (?, ?)",
    [sanitizedName, houseIdNum],
    function (err) {
      if (err) {
        console.error("Erro ao criar atleta:", err);
        return res.status(500).json({ error: "Erro ao criar atleta" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/houses/:id/athletes', (req, res) => {
  const houseId = req.params.id;
  const query = `
    SELECT a.id, a.name,
           COALESCE(SUM(sr.value), 0) AS total_points
    FROM athletes a
    LEFT JOIN scores sc ON sc.athlete_id = a.id
    LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE a.house_id = ?
    GROUP BY a.id, a.name
    ORDER BY total_points DESC, a.name ASC
  `;
  db.all(query, [houseId], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar atletas:", err);
      return res.status(500).json({ error: "Erro ao buscar atletas" });
    }
    res.json(rows || []);
  });
});
// Detalhes básicos de um atleta
app.get('/api/athletes/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT a.id, a.name, h.name AS house_name
    FROM athletes a
    JOIN houses h ON a.house_id = h.id
    WHERE a.id = ?
  `;
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar atleta:", err);
      return res.status(500).json({ error: "Erro ao buscar atleta" });
    }
    if (!row) {
      return res.status(404).json({ error: "Atleta não encontrado" });
    }
    res.json(row);
  });
});

// Histórico de pontos de um atleta
app.get('/api/athletes/:id/scores', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT
      sc.id,
      sr.name AS rule_name,
      sr.value AS value
    FROM scores sc
    JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE sc.athlete_id = ?
    ORDER BY sc.id DESC
  `;
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico do atleta:", err);
      return res.status(500).json({ error: "Erro ao buscar histórico do atleta" });
    }
    res.json(rows || []);
  });
});

// =============== REGRAS ==================

app.get('/api/rules', (req, res) => {
  db.all("SELECT * FROM scoring_rules WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar regras:", err);
      return res.status(500).json({ error: "Erro ao buscar regras" });
    }
    res.json(rows || []);
  });
});

app.post('/api/rules', (req, res) => {
  const { name, value } = req.body;
  
  // Sanitização básica: remove espaços extras e valida nome
  const sanitizedName = (name || '').trim();
  if (!sanitizedName || sanitizedName.length === 0 || sanitizedName.length > 200) {
    return res.status(400).json({ error: "Nome inválido" });
  }
  
  const v = parseInt(value, 10);
  if (isNaN(v) || v < -1000 || v > 1000) {
    return res.status(400).json({ error: "Valor deve ser um número entre -1000 e 1000" });
  }

  db.run(
    "INSERT INTO scoring_rules (name, value) VALUES (?, ?)",
    [sanitizedName, v],
    function (err) {
      if (err) {
        console.error("Erro ao criar regra:", err);
        return res.status(500).json({ error: "Erro ao criar regra" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/rules/:id', (req, res) => {
  const id = req.params.id;
  // Soft delete: marca como inativa ao invés de deletar
  db.run(
    "UPDATE scoring_rules SET active = 0 WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("Erro ao desativar regra:", err);
        return res.status(500).json({ error: "Erro ao desativar regra" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Regra não encontrada" });
      }
      res.json({ success: true });
    }
  );
});

// =============== PACIENTES ==================

app.get('/api/patients', (req, res) => {
  const { search, active } = req.query;
  let query = "SELECT * FROM patients WHERE 1=1";
  const params = [];
  
  if (active !== undefined) {
    query += " AND active = ?";
    params.push(active === 'true' ? 1 : 0);
  }
  
  if (search) {
    query += " AND (name LIKE ? OR cpf LIKE ? OR phone LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += " ORDER BY name ASC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Erro ao buscar pacientes:", err);
      return res.status(500).json({ error: "Erro ao buscar pacientes" });
    }
    res.json(rows || []);
  });
});

app.get('/api/patients/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  db.get("SELECT * FROM patients WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar paciente:", err);
      return res.status(500).json({ error: "Erro ao buscar paciente" });
    }
    if (!row) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }
    res.json(row);
  });
});

app.post('/api/patients', (req, res) => {
  const { name, cpf, phone, email, birth_date, address, city, state, zip_code, 
          emergency_contact, emergency_phone, health_insurance, health_insurance_number, notes } = req.body;
  
  const sanitizedName = (name || '').trim();
  if (!sanitizedName || sanitizedName.length === 0) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  
  db.run(
    `INSERT INTO patients (name, cpf, phone, email, birth_date, address, city, state, zip_code,
                          emergency_contact, emergency_phone, health_insurance, health_insurance_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sanitizedName, cpf || null, phone || null, email || null, birth_date || null,
     address || null, city || null, state || null, zip_code || null,
     emergency_contact || null, emergency_phone || null, health_insurance || null,
     health_insurance_number || null, notes || null],
    function (err) {
      if (err) {
        console.error("Erro ao criar paciente:", err);
        return res.status(500).json({ error: "Erro ao criar paciente" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/patients/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  const { name, cpf, phone, email, birth_date, address, city, state, zip_code,
          emergency_contact, emergency_phone, health_insurance, health_insurance_number, notes, active } = req.body;
  
  const sanitizedName = (name || '').trim();
  if (!sanitizedName || sanitizedName.length === 0) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  
  db.run(
    `UPDATE patients SET name = ?, cpf = ?, phone = ?, email = ?, birth_date = ?, address = ?,
                        city = ?, state = ?, zip_code = ?, emergency_contact = ?, emergency_phone = ?,
                        health_insurance = ?, health_insurance_number = ?, notes = ?, active = ?,
                        updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [sanitizedName, cpf || null, phone || null, email || null, birth_date || null,
     address || null, city || null, state || null, zip_code || null,
     emergency_contact || null, emergency_phone || null, health_insurance || null,
     health_insurance_number || null, notes || null, active !== undefined ? (active ? 1 : 0) : 1, id],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar paciente:", err);
        return res.status(500).json({ error: "Erro ao atualizar paciente" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/patients/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  // Soft delete
  db.run(
    "UPDATE patients SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("Erro ao desativar paciente:", err);
        return res.status(500).json({ error: "Erro ao desativar paciente" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      res.json({ success: true });
    }
  );
});

// =============== AGENDAMENTOS ==================

app.get('/api/appointments', (req, res) => {
  const { date, start_date, end_date, patient_id, status } = req.query;
  let query = `SELECT a.*, p.name as patient_name, p.phone as patient_phone
               FROM appointments a
               LEFT JOIN patients p ON a.patient_id = p.id
               WHERE 1=1`;
  const params = [];
  
  if (date) {
    query += " AND a.appointment_date = ?";
    params.push(date);
  } else if (start_date && end_date) {
    query += " AND a.appointment_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }
  
  if (patient_id) {
    query += " AND a.patient_id = ?";
    params.push(parseInt(patient_id, 10));
  }
  
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }
  
  query += " ORDER BY a.appointment_date ASC, a.start_time ASC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Erro ao buscar agendamentos:", err);
      return res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
    res.json(rows || []);
  });
});

app.get('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  db.get(`SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.email as patient_email
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          WHERE a.id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar agendamento:", err);
      return res.status(500).json({ error: "Erro ao buscar agendamento" });
    }
    if (!row) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }
    res.json(row);
  });
});

app.post('/api/appointments', (req, res) => {
  const { patient_id, title, description, appointment_date, start_time, end_time,
          service_type, professional, status, notes } = req.body;
  
  if (!patient_id || !title || !appointment_date || !start_time) {
    return res.status(400).json({ error: "Paciente, título, data e horário são obrigatórios" });
  }
  
  const sanitizedTitle = (title || '').trim();
  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }
  
  db.run(
    `INSERT INTO appointments (patient_id, title, description, appointment_date, start_time, end_time,
                              service_type, professional, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parseInt(patient_id, 10), sanitizedTitle, description || null, appointment_date, start_time,
     end_time || null, service_type || 'Consulta', professional || null,
     status || 'agendado', notes || null],
    function (err) {
      if (err) {
        console.error("Erro ao criar agendamento:", err);
        return res.status(500).json({ error: "Erro ao criar agendamento" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  const { patient_id, title, description, appointment_date, start_time, end_time,
          service_type, professional, status, notes } = req.body;
  
  const sanitizedTitle = (title || '').trim();
  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }
  
  db.run(
    `UPDATE appointments SET patient_id = ?, title = ?, description = ?, appointment_date = ?,
                            start_time = ?, end_time = ?, service_type = ?, professional = ?,
                            status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [parseInt(patient_id, 10), sanitizedTitle, description || null, appointment_date, start_time,
     end_time || null, service_type || 'Consulta', professional || null, status || 'agendado',
     notes || null, id],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar agendamento:", err);
        return res.status(500).json({ error: "Erro ao atualizar agendamento" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao deletar agendamento:", err);
      return res.status(500).json({ error: "Erro ao deletar agendamento" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }
    res.json({ success: true });
  });
});

// =============== FINANCEIRO ==================

app.get('/api/financial', (req, res) => {
  const { type, start_date, end_date, patient_id } = req.query;
  let query = `SELECT f.*, p.name as patient_name
               FROM financial_transactions f
               LEFT JOIN patients p ON f.patient_id = p.id
               WHERE 1=1`;
  const params = [];
  
  if (type) {
    query += " AND f.type = ?";
    params.push(type);
  }
  
  if (start_date && end_date) {
    query += " AND (f.due_date BETWEEN ? AND ? OR f.payment_date BETWEEN ? AND ?)";
    params.push(start_date, end_date, start_date, end_date);
  }
  
  if (patient_id) {
    query += " AND f.patient_id = ?";
    params.push(parseInt(patient_id, 10));
  }
  
  query += " ORDER BY f.due_date DESC, f.created_at DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Erro ao buscar transações:", err);
      return res.status(500).json({ error: "Erro ao buscar transações" });
    }
    res.json(rows || []);
  });
});

app.get('/api/financial/summary', (req, res) => {
  const { start_date, end_date } = req.query;
  let whereClause = "WHERE 1=1";
  const params = [];
  
  if (start_date && end_date) {
    whereClause += " AND (due_date BETWEEN ? AND ? OR payment_date BETWEEN ? AND ?)";
    params.push(start_date, end_date, start_date, end_date);
  }
  
  const query = `
    SELECT 
      type,
      SUM(amount) as total,
      COUNT(*) as count,
      SUM(CASE WHEN payment_date IS NOT NULL THEN amount ELSE 0 END) as paid_total
    FROM financial_transactions
    ${whereClause}
    GROUP BY type
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Erro ao buscar resumo financeiro:", err);
      return res.status(500).json({ error: "Erro ao buscar resumo financeiro" });
    }
    
    const summary = {
      receitas: { total: 0, paid: 0, pending: 0, count: 0 },
      despesas: { total: 0, paid: 0, pending: 0, count: 0 }
    };
    
    rows.forEach(row => {
      const key = row.type === 'receita' ? 'receitas' : 'despesas';
      summary[key].total = parseFloat(row.total || 0);
      summary[key].paid = parseFloat(row.paid_total || 0);
      summary[key].pending = summary[key].total - summary[key].paid;
      summary[key].count = row.count || 0;
    });
    
    summary.balance = summary.receitas.total - summary.despesas.total;
    summary.paid_balance = summary.receitas.paid - summary.despesas.paid;
    
    res.json(summary);
  });
});

app.post('/api/financial', (req, res) => {
  const { type, category, description, amount, due_date, payment_date, payment_method,
          patient_id, appointment_id, notes } = req.body;
  
  if (!type || !description || !amount) {
    return res.status(400).json({ error: "Tipo, descrição e valor são obrigatórios" });
  }
  
  if (type !== 'receita' && type !== 'despesa') {
    return res.status(400).json({ error: "Tipo deve ser 'receita' ou 'despesa'" });
  }
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: "Valor inválido" });
  }
  
  const sanitizedDesc = (description || '').trim();
  if (!sanitizedDesc || sanitizedDesc.length === 0) {
    return res.status(400).json({ error: "Descrição é obrigatória" });
  }
  
  db.run(
    `INSERT INTO financial_transactions (type, category, description, amount, due_date, payment_date,
                                        payment_method, patient_id, appointment_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, category || null, sanitizedDesc, amountNum, due_date || null, payment_date || null,
     payment_method || null, patient_id ? parseInt(patient_id, 10) : null,
     appointment_id ? parseInt(appointment_id, 10) : null, notes || null],
    function (err) {
      if (err) {
        console.error("Erro ao criar transação:", err);
        return res.status(500).json({ error: "Erro ao criar transação" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/financial/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  const { type, category, description, amount, due_date, payment_date, payment_method,
          patient_id, appointment_id, notes } = req.body;
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: "Valor inválido" });
  }
  
  const sanitizedDesc = (description || '').trim();
  if (!sanitizedDesc || sanitizedDesc.length === 0) {
    return res.status(400).json({ error: "Descrição é obrigatória" });
  }
  
  db.run(
    `UPDATE financial_transactions SET type = ?, category = ?, description = ?, amount = ?,
                                      due_date = ?, payment_date = ?, payment_method = ?,
                                      patient_id = ?, appointment_id = ?, notes = ?,
                                      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [type, category || null, sanitizedDesc, amountNum, due_date || null, payment_date || null,
     payment_method || null, patient_id ? parseInt(patient_id, 10) : null,
     appointment_id ? parseInt(appointment_id, 10) : null, notes || null, id],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar transação:", err);
        return res.status(500).json({ error: "Erro ao atualizar transação" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/financial/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  
  db.run("DELETE FROM financial_transactions WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao deletar transação:", err);
      return res.status(500).json({ error: "Erro ao deletar transação" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }
    res.json({ success: true });
  });
});

// =============== PONTUAÇÃO ==================

app.post('/api/scores', (req, res) => {
  const { athlete_id, rule_id } = req.body;
  if (!athlete_id || !rule_id) {
    return res.status(400).json({ error: "Atleta e regra são obrigatórios" });
  }

  db.run(
    "INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)",
    [athlete_id, rule_id],
    function (err) {
      if (err) {
        console.error("Erro ao registrar pontos:", err);
        return res.status(500).json({ error: "Erro ao registrar pontos" });
      }
      res.json({ id: this.lastID });
    }
  );
});

// --------- MIDDLEWARE DE ERRO DO MULTER ----------
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }
    return res.status(400).json({ error: 'Erro no upload: ' + error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

// --------- FALLBACK FRONTEND ----------
app.use((req, res) => {
  // Se for uma rota de API, retorna 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  // Para rotas de frontend, verifica se o arquivo existe
  const frontendPath = path.join(__dirname, '../frontend', req.path);
  const indexPath = path.join(__dirname, '../frontend/index.html');
  
  // Se o arquivo solicitado existe e é HTML, serve ele
  if (fs.existsSync(frontendPath) && req.path.endsWith('.html')) {
    return res.sendFile(frontendPath);
  }
  
  // Caso contrário, serve index.html (SPA behavior)
  res.sendFile(indexPath);
});

// --------- INICIAR SERVIDOR ----------
app.listen(PORT, () => {
  console.log(`Gestão Marcha rodando em http://localhost:${PORT}`);
});
