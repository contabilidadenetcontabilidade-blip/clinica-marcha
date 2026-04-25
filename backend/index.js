const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('./db');
const cron = require('node-cron');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// --------- MIDDLEWARES BÁSICOS ----------
app.use(express.json());
app.get('/', (req, res) => {
  res.redirect('/login.html');
});
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/admin/financeiro', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/financeiro.html'));
});
app.get('/admin/agenda', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/agenda.html'));
});
app.use('/assets', express.static(path.join(__dirname, '../assets')));
// --- EXPANSÃO MARCHA CUP ---
app.use('/manual', express.static(path.join(__dirname, '../manual')));
app.use('/api/cards/image', express.static(path.join(__dirname, '../cartas')));
app.use('/cartas', express.static(path.join(__dirname, '../cartas')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));



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

// --- UPLOAD DE FOTOS DE ALUNOS ---
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'student-' + unique + ext);
  }
});

const uploadStudent = multer({
  storage: studentStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
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
      fs.unlink(filePath, () => { });
    }
    return res.status(400).json({ error: "Nome inválido" });
  }

  // Valida formato de cor (hex)
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    if (req.file) {
      const filePath = path.join(__dirname, '../assets/houses', req.file.filename);
      fs.unlink(filePath, () => { });
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
      SELECT COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) AS total_points
      FROM scores sc
      JOIN scoring_rules sr ON sc.rule_id = sr.id
      JOIN athletes a ON sc.athlete_id = a.patient_id
      WHERE a.house_id = ?
    `;

    const athletesQuery = `
      SELECT a.id, a.name, a.is_captain,
             COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) AS total_points
      FROM athletes a
      LEFT JOIN scores sc ON sc.athlete_id = a.patient_id
      LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
      WHERE a.house_id = ?
      GROUP BY a.id, a.name, a.is_captain
      ORDER BY total_points DESC, a.name ASC
    `;

    const bestCategoryQuery = `
      SELECT sr.id, sr.name,
             COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) AS total_points
      FROM scores sc
      JOIN scoring_rules sr ON sc.rule_id = sr.id
      JOIN athletes a ON sc.athlete_id = a.patient_id
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
  const athleteId = req.params.id;

  // Traduzir athlete_id → patient_id (scores armazena patient_id)
  db.get("SELECT patient_id FROM athletes WHERE id = ?", [athleteId], (err, athlete) => {
    if (err || !athlete) {
      return res.status(404).json({ error: "Atleta não encontrado" });
    }

    const patientId = athlete.patient_id;
    const query = `
      SELECT
        sc.id,
        sr.name AS rule_name,
        CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END AS value,
        sc.created_at
      FROM scores sc
      JOIN scoring_rules sr ON sc.rule_id = sr.id
      WHERE sc.athlete_id = ?
      ORDER BY sc.created_at DESC
    `;
    db.all(query, [patientId], (err, rows) => {
      if (err) {
        console.error("Erro ao buscar histórico do atleta:", err);
        return res.status(500).json({ error: "Erro ao buscar histórico do atleta" });
      }
      res.json(rows || []);
    });
  });
});

// =============== REGRAS ==================

app.get('/api/rules', (req, res) => {
  db.all("SELECT * FROM scoring_rules WHERE active = 1", [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
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

  // Determine filter type: 'student' (default) or 'team'
  const filterType = req.query.type || 'student';

  if (filterType === 'team') {
    // Show only Admins/Coords/Staff
    query += " AND (role IN ('admin', 'coord', 'master') OR name LIKE '%Admin%' OR name LIKE '%Coord%')";
  } else {
    // Show only Patients/Students (Default)
    query += " AND (role IS NULL OR role NOT IN ('admin', 'coord', 'master'))";
    query += " AND name NOT LIKE '%Admin%' AND name NOT LIKE '%Coord%' AND name != 'Administrador'";
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
    emergency_contact, emergency_phone, health_insurance, health_insurance_number, 
    notes, house_id } = req.body;

  const sanitizedName = (name || '').trim();
  if (!sanitizedName || sanitizedName.length === 0) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  if (!house_id) {
    return res.status(400).json({ error: "Casa é obrigatória para participar da Marcha Cup" });
  }

  // Verificar duplicidade de nome
  db.get("SELECT id FROM patients WHERE LOWER(name) = LOWER(?)", [sanitizedName], (err, existing) => {
    if (existing) {
      return res.status(409).json({ error: "Este nome já está cadastrado. Por favor, adicione um sobrenome ou identificador único." });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO patients (name, username, cpf, phone, email, birth_date, address, city, state, zip_code,
                              emergency_contact, emergency_phone, health_insurance, health_insurance_number, notes, password, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '123', 'atleta')`,
        [sanitizedName, sanitizedName, cpf || null, phone || null, email || null, birth_date || null,
          address || null, city || null, state || null, zip_code || null,
          emergency_contact || null, emergency_phone || null, health_insurance || null,
          health_insurance_number || null, notes || null],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Erro ao criar paciente" });
          }

          const newPatientId = this.lastID;
          db.run("INSERT INTO athletes (name, house_id, patient_id) VALUES (?, ?, ?)", 
            [sanitizedName, parseInt(house_id), newPatientId], function (err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Erro ao criar vínculo de atleta" });
            }
            db.run("COMMIT");
            res.json({ 
              id: newPatientId,
              login: sanitizedName,
              senha: '123',
              message: `Cadastro concluído! Login: ${sanitizedName} | Senha: 123`
            });
          });
        }
      );
    });
  });
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

// Upload de Foto do Paciente/Aluno
app.post('/api/patients/:id/photo', uploadStudent.single('photo'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });

  const photoPath = `/uploads/${req.file.filename}`;
  db.run("UPDATE patients SET photo = ? WHERE id = ?", [photoPath, id], function (err) {
    if (err) {
      console.error("Erro ao salvar foto no banco:", err);
      return res.status(500).json({ error: "Erro ao salvar foto no banco" });
    }
    res.json({ success: true, photo: photoPath });
  });
});

// =============== PROFISSIONAIS ==================

app.get('/api/professionals', (req, res) => {
  db.all("SELECT * FROM professionals WHERE active = 1 ORDER BY name ASC", [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar profissionais:", err);
      return res.status(500).json({ error: "Erro ao buscar profissionais" });
    }
    res.json(rows || []);
  });
});

app.get('/api/professionals/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  db.get("SELECT * FROM professionals WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar profissional:", err);
      return res.status(500).json({ error: "Erro ao buscar profissional" });
    }
    if (!row) return res.status(404).json({ error: "Profissional não encontrado" });
    res.json(row);
  });
});

app.post('/api/professionals', (req, res) => {
  const { name, specialty, registration_number, color } = req.body;
  const sanitizedName = (name || '').trim();
  if (!sanitizedName) return res.status(400).json({ error: "Nome é obrigatório" });

  db.run(
    `INSERT INTO professionals (name, specialty, registration_number, color) VALUES (?, ?, ?, ?)`,
    [sanitizedName, specialty || null, registration_number || null, color || '#2196F3'],
    function (err) {
      if (err) {
        console.error("Erro ao criar profissional:", err);
        return res.status(500).json({ error: "Erro ao criar profissional" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/professionals/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const { name, specialty, registration_number, color, active } = req.body;
  const sanitizedName = (name || '').trim();
  if (!sanitizedName) return res.status(400).json({ error: "Nome é obrigatório" });

  db.run(
    `UPDATE professionals SET name = ?, specialty = ?, registration_number = ?, color = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [sanitizedName, specialty || null, registration_number || null, color || '#2196F3', active !== undefined ? (active ? 1 : 0) : 1, id],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar profissional:", err);
        return res.status(500).json({ error: "Erro ao atualizar profissional" });
      }
      if (this.changes === 0) return res.status(404).json({ error: "Profissional não encontrado" });
      res.json({ success: true });
    }
  );
});

app.delete('/api/professionals/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  db.run("UPDATE professionals SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao desativar profissional:", err);
      return res.status(500).json({ error: "Erro ao desativar profissional" });
    }
    if (this.changes === 0) return res.status(404).json({ error: "Profissional não encontrado" });
    res.json({ success: true });
  });
});

// =============== AGENDAMENTOS ==================

app.get('/api/appointments', (req, res) => {
  const { date, start_date, end_date, patient_id, status } = req.query;
  let query = `SELECT a.*, p.name as patient_name, p.phone as patient_phone
               FROM appointments a
               LEFT JOIN patients p ON a.patient_id = p.id
               WHERE 1=1`;
  const params = [];

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd
  const convertDate = (d) => {
    if (!d) return null;
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return d; // Assume it's already in yyyy-mm-dd or invalid
  };

  if (date) {
    const formattedDate = convertDate(date);
    if (formattedDate) {
      query += " AND a.appointment_date = ?";
      params.push(formattedDate);
    } else {
      return res.status(400).json({ error: "Formato de data inválido. Use dd/mm/yyyy." });
    }
  } else if (start_date && end_date) {
    const formattedStartDate = convertDate(start_date);
    const formattedEndDate = convertDate(end_date);
    if (formattedStartDate && formattedEndDate) {
      query += " AND a.appointment_date BETWEEN ? AND ?";
      params.push(formattedStartDate, formattedEndDate);
    } else {
      return res.status(400).json({ error: "Formato de data inválido para start_date ou end_date. Use dd/mm/yyyy." });
    }
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

  console.log('═══════════════════════════════════════════════');
  console.log('PUT /api/appointments/%s => Body:', id, JSON.stringify(req.body));

  const { patient_id, title, description, appointment_date, start_time, end_time,
    service_type, professional, status, notes, procedure_value } = req.body;

  const sanitizedTitle = (title || '').trim();
  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }

  const procValue = parseFloat(procedure_value) || 0;
  console.log(`[AGENDA] apt_id=${id} | status=${status} | procedure_value=${procValue} | patient_id=${patient_id}`);

  db.get("SELECT status FROM appointments WHERE id = ?", [id], (err, oldApt) => {
    if (err) return res.status(500).json({ error: "Erro ao verificar agendamento" });
    if (!oldApt) return res.status(404).json({ error: "Agendamento não encontrado" });

    console.log(`[AGENDA] oldStatus="${oldApt.status}" => newStatus="${status}"`);

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

        // --- GATILHOS DE PONTUAÇÃO (Se o status alterou) ---
        if (oldApt.status !== status) {
          db.get("SELECT a.house_id FROM athletes a WHERE a.patient_id = ?", [patient_id], (err, ath) => {
            if (!err && ath && ath.house_id) {
              if (status === 'confirmado' || status === 'realizado') {
                db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                  [ath.house_id, patient_id, 1, `Presença: ${sanitizedTitle}`]);
                db.get("SELECT id FROM athletes WHERE patient_id = ?", [patient_id], (err, athRow) => {
                  if (!err && athRow) {
                    insertScore(athRow.id, 1, { json: () => {}, status: () => ({ json: () => {} }) });
                  }
                });
              } else if (status === 'falta') {
                db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [ath.house_id, patient_id, -2, `Falta sem justif.: ${sanitizedTitle}`]);
              }
            }
          });
        }

        // --- GATILHO FINANCEIRO: Gerar Receita automática ---
        // Dispara SEMPRE que status for confirmado/realizado E houver valor > 0
        // Verifica duplicidade pelo appointment_id para não gerar entrada dupla
        if ((status === 'confirmado' || status === 'realizado') && procValue > 0) {
          console.log(`[FINANCEIRO] Tentando gerar transação: R$${procValue.toFixed(2)} para apt_id=${id}`);

          // Anti-duplicidade: checa se já existe transação para este agendamento
          db.get("SELECT id FROM financial_transactions WHERE appointment_id = ?", [id], (checkErr, existing) => {
            if (checkErr) {
              console.error("[FINANCEIRO] Erro ao checar duplicidade:", checkErr);
              return;
            }
            if (existing) {
              console.log(`[FINANCEIRO] Transação já existe (id=${existing.id}) para apt_id=${id}. Ignorando duplicata.`);
              return;
            }

            db.get("SELECT name, health_insurance FROM patients WHERE id = ?", [patient_id], (err, pat) => {
              const patientName = (pat && pat.name) ? pat.name : 'Paciente';
              const convenio = (pat && pat.health_insurance) ? pat.health_insurance : '';
              const descFinanceira = `${service_type || 'Procedimento'} - ${patientName} (${sanitizedTitle})`;

              console.log(`[FINANCEIRO] INSERT: type=receita | amount=${procValue} | desc="${descFinanceira}" | convenio=${convenio}`);

              db.run(
                `INSERT INTO financial_transactions (type, category, description, amount, due_date, payment_date, payment_method, patient_id, appointment_id, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['receita', service_type || 'consulta', descFinanceira, procValue,
                  appointment_date, appointment_date, convenio || null,
                  parseInt(patient_id, 10), id, `Gerado via Agenda | Convênio: ${convenio || 'N/A'}`],
                function (fErr) {
                  if (fErr) {
                    console.error("❌ [FINANCEIRO] ERRO ao inserir transação:", fErr.message);
                  } else {
                    console.log(`✅ [FINANCEIRO] Transação #${this.lastID} gerada: R$${procValue.toFixed(2)} - ${descFinanceira}`);
                  }
                }
              );
            });
          });
        } else {
          console.log(`[FINANCEIRO] Trigger NÃO disparado: status="${status}" | procValue=${procValue}`);
        }

        res.json({ success: true });
      }
    );
  });
});

// --- ROTA: Buscar Aulas de Reposição Pendentes ---
app.get('/api/appointments/pending-makeups', (req, res) => {
  const query = `
    SELECT a.*, p.name as patient_name, p.house_id
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.status = 'falta_justificada' AND (a.makeup_resolved IS NULL OR a.makeup_resolved = 0)
    ORDER BY a.appointment_date ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Erro fetching pending makeups:", err);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
    res.json(rows || []);
  });
});

// --- ROTA: Dar baixa na aula de reposição ---
app.put('/api/appointments/:id/resolve-makeup', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  db.run("UPDATE appointments SET makeup_resolved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Erro interno no servidor." });
    if (this.changes === 0) return res.status(404).json({ error: "Agendamento não encontrado." });
    // Se quiser dar pontuação pela reposição, pode dar aqui +1. Vamos manter simples como baixa por enquanto.
    res.json({ success: true, message: "Baixa de reposição efetuada." });
  });
});

// --- ROTAS DO ADMIN (Redirecionamento UX) ---
app.get('/admin/financeiro', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/financeiro.html'));
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

// --- Rota de Inadimplência ---
app.get('/api/financial/defaulting', (req, res) => {
  const query = `
    SELECT f.*, p.name as patient_name
    FROM financial_transactions f
    LEFT JOIN patients p ON f.patient_id = p.id
    WHERE f.type = 'receita' AND f.payment_date IS NULL AND f.due_date < date('now')
    ORDER BY f.due_date ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro na base ao buscar inadimplência" });
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
  const { type, category, description, amount, due_date, payment_date, payment_method, patient_id, notes, bonus_pack } = req.body;
  if (!type || !description || !amount) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  db.run(
    `INSERT INTO financial_transactions 
      (type, category, description, amount, due_date, payment_date, payment_method, patient_id, notes, bonus_pack)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, category || null, description, amount, due_date || null, payment_date || null, payment_method || null, patient_id ? parseInt(patient_id, 10) : null, notes || null, bonus_pack ? 1 : 0],
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
    patient_id, appointment_id, notes, bonus_pack } = req.body;

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
                                      bonus_pack = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [type, category || null, sanitizedDesc, amountNum, due_date || null, payment_date || null,
      payment_method || null, patient_id ? parseInt(patient_id, 10) : null,
      appointment_id ? parseInt(appointment_id, 10) : null, notes || null, bonus_pack ? 1 : 0, id],
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

// =============== ROTAS INJETADAS PELO AGENTE ==================

// Rota de Ranking (Cálculo de pontos das casas)
app.get('/api/ranking', (req, res) => {
  console.log('GET /api/ranking');
  const query = `
    SELECT h.id, h.name, h.color, h.crest,
           COALESCE(SUM(CASE WHEN sc.points IS NOT NULL THEN sc.points ELSE sr.value END), 0) as total_points
    FROM houses h
    LEFT JOIN athletes a ON h.id = a.house_id
    LEFT JOIN scores sc ON a.patient_id = sc.athlete_id
    LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
    WHERE h.active = 1
    GROUP BY h.id
    ORDER BY total_points DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Erro no ranking:", err);
      return res.status(500).json({ error: "Erro ao calcular ranking" });
    }
    res.json(rows || []);
  });
});

// --- API DO BARALHO DE PODER (CATÁLOGO GERAL) ---
app.get('/api/cards/all', (req, res) => {
  db.all("SELECT id, name, description, rarity, image_path FROM cards ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// --- API DE EFEITOS ATIVOS (COM BLINDAGEM STEALTH) ---
app.get('/api/active-cards', (req, res) => {
  const athleteId = req.query.athlete_id; // Passado pela UI se disponível

  // Oculta CORINGA_REDIRECTION se o usuário for o capitão alvo (source_captain_id)
  let query = "SELECT * FROM active_effects WHERE expires_at > CURRENT_TIMESTAMP";
  let params = [];

  if (athleteId) {
    query += " AND NOT (effect_type = 'CORINGA_REDIRECTION' AND source_captain_id = ?)";
    params.push(athleteId);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// --- API DE COMPRA/TROCA DE PONTOS (ERRO CAMUFLADO STEALTH) ---
app.post('/api/cards/buy', (req, res) => {
  const { athlete_id, cost } = req.body;
  if (!athlete_id || !cost) return res.status(400).json({ error: "Parâmetros inválidos" });

  // 1) Calcula o Saldo Visível normal
  db.get(`
    SELECT 
      (SELECT COALESCE(SUM(sr.value), 0) FROM scores s JOIN scoring_rules sr ON s.rule_id = sr.id WHERE s.athlete_id = ?) +
      (SELECT COALESCE(SUM(points_awarded), 0) FROM house_points_log WHERE student_id = (SELECT patient_id FROM athletes WHERE id = ?)) as saldo_visivel
  `, [athlete_id, athlete_id], (err, scoreRow) => {
    if (err) return res.status(500).json({ error: err.message });

    let saldoVisivel = scoreRow ? (scoreRow.saldo_visivel || 0) : 0;

    // 2) Calcula os pontos roubados e ocultos na active_effects
    db.get("SELECT COALESCE(SUM(stolen_points_accumulator), 0) as stolen FROM active_effects WHERE effect_type = 'CORINGA_REDIRECTION' AND source_captain_id = ? AND expires_at > CURRENT_TIMESTAMP", [athlete_id], (err, stealRow) => {
      let stolen = stealRow ? (stealRow.stolen || 0) : 0;
      let saldoReal = saldoVisivel - stolen;

      if (cost <= saldoVisivel && cost > saldoReal) {
        // [STEALTH TRIGGERED] Saldo Visivel é suficiente, mas o Real não!
        console.log(`[STEALTH] Compra bloqueada para o Capitão ID ${athlete_id} devido ao desvio oculto do Coringa. Saldo insuficiente mascarado.`);
        return res.status(400).json({ error: "Serviço temporariamente indisponível para esta transação. Tente novamente em alguns minutos." });
      }

      if (cost > saldoVisivel) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }

      // Lógica de dedução de pontos para a compra aconteceria aqui (Desnecessário pro MVP atual, apenas logar sucesso)
      res.json({ success: true, message: "Compra realizada com sucesso!" });
    });
  });
});

// --- API DE PONTUAÇÃO (MEINHAS) ---
app.post('/api/scores', (req, res) => {
  const { student_id, athlete_id, rule_id } = req.body;

  if (!rule_id) return res.status(400).json({ error: "Regra é obrigatória" });
  if (!student_id && !athlete_id) return res.status(400).json({ error: "Aluno/Atleta é obrigatório" });

  // Se veio student_id, precisamos achar o athlete_id correspondente
  if (student_id && !athlete_id) {
    db.get("SELECT id FROM athletes WHERE patient_id = ?", [student_id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        // Se não tem atleta, cria um? Ou erro?
        // Vamos assumir que deve ter. Se não, tenta inserir direto se a tabela permitir, 
        // mas a tabela scores deve ligar com athletes.
        // Tentar registrar mesmo assim? Não, precisa ser atleta de uma casa.
        return res.status(404).json({ error: "Aluno não é um atleta de casa." });
      }
      insertScore(row.id, rule_id, res);
    });
  } else {
    insertScore(athlete_id, rule_id, res);
  }
});

function insertScore(athleteId, ruleId, res) {
  db.get("SELECT name, value FROM scoring_rules WHERE id = ?", [ruleId], (err, rule) => {
    if (err || !rule) return res.status(500).json({ error: "Regra não encontrada." });
    db.get("SELECT house_id, patient_id FROM athletes WHERE id = ?", [athleteId], (err, athlete) => {
      if (err || !athlete) return res.status(500).json({ error: "Atleta não encontrado." });

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // --- INTERCEPTOR CORINGA (MODO STEALTH) ---
        const nowIso = new Date().toISOString();
        db.get("SELECT id, beneficiary_id, house_id FROM active_effects WHERE effect_type = 'CORINGA_REDIRECTION' AND source_captain_id = ? AND expires_at > ? LIMIT 1", [athleteId, nowIso], (err, coringaActive) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

          if (coringaActive) {
            // MODO STEALTH: Acumula o valor silenciosamente. O log e o crédito só virão na expiração.
            db.run("UPDATE active_effects SET stolen_points_accumulator = stolen_points_accumulator + ? WHERE id = ?", [rule.value, coringaActive.id], (err) => {
              if (err) console.error("[STEALTH] Erro ao acumular pontos do Coringa:", err.message);
            });
            // IMPORTANTE: NÃO HÁ RETURN AQUI! O fluxo continua, e o alvo ganha o ponto (ilusão).
          }

          // Verificar efeito INFLUENCER ativo para a casa
          const nowIso2 = new Date().toISOString(); // Renamed to avoid shadow if any
          db.get(
            "SELECT id FROM active_effects WHERE house_id = ? AND effect_type = 'INFLUENCER' AND expires_at > ?",
            [athlete.house_id, nowIso2],
            (err, influencerEffect) => {
              // Dobra o valor apenas para regras de mídia social se Influencer estiver ativo
              // IDs fixos das regras de mídia social: 3 (Story) e 5 (Reels/Feed)
              const isMidia = [3, 5].includes(ruleId);

              // Inserir score extra se Influencer ativo e regra de mídia
              if (influencerEffect && isMidia) {
                db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)", [athlete.patient_id, ruleId]);
              }

              db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)", [athlete.patient_id, ruleId], function (err) {
                if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                const scoreId = this.lastID;

            if (rule.name === '[+1 Ponto] Presença') {
              db.get("SELECT COUNT(*) as count FROM scores s JOIN scoring_rules sr ON s.rule_id = sr.id WHERE s.athlete_id = ? AND sr.name = '[+1 Ponto] Presença'", [athlete.patient_id], (err, row) => {
                let totalPresencas = row ? row.count : 0;
                if (totalPresencas > 0 && totalPresencas % 3 === 0) {
                  db.get("SELECT id FROM cards WHERE rarity = 'Comum' ORDER BY RANDOM() LIMIT 1", [], (err, card) => {
                    if (card) {
                      const crypto = require('crypto');
                      const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
                      db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [athlete.patient_id, card.id, hash]);
                    }
                  });
                }
              });
            }

            // 2) Automação do Pomo de Ouro
            const currentMonthLike = new Date().toISOString().substring(0, 7) + '%';
            db.get("SELECT COUNT(*) as count FROM athletes WHERE house_id = ? AND active = 1", [athlete.house_id], (err, hRow) => {
              const athleteCount = hRow ? hRow.count : 0;
              const metaMinima = (athleteCount * 20) + 10;

              // Total Mensal da Casa
              db.get(`
              SELECT 
                (SELECT COALESCE(SUM(sr.value), 0) FROM scores s JOIN athletes a ON s.athlete_id = a.id JOIN scoring_rules sr ON s.rule_id = sr.id WHERE a.house_id = ? AND s.created_at LIKE ?) +
                (SELECT COALESCE(SUM(points_awarded), 0) FROM house_points_log WHERE house_id = ? AND created_at LIKE ?) as total_mes
            `, [athlete.house_id, currentMonthLike, athlete.house_id, currentMonthLike], (err, tRow) => {
                const totalMes = tRow ? tRow.total_mes : 0;

                if (totalMes >= metaMinima) {
                  db.get("SELECT id FROM house_points_log WHERE house_id = ? AND description LIKE '%Pomo: Meta Atingida%' AND created_at LIKE ?", [athlete.house_id, currentMonthLike], (err, pRow) => {
                    if (!pRow) {
                      db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, NULL, 3, 'Pomo: Meta Atingida (+3 automáticos)')", [athlete.house_id]);
                    }
                  });
                }

                // Recorde Histórico Simplificado
                db.get(`
                SELECT MAX(mes_total) as recorde FROM (
                  SELECT strftime('%Y-%m', created_at) as mes, SUM(points_awarded) as mes_total FROM house_points_log WHERE house_id = ? GROUP BY mes
                ) WHERE mes != ?
              `, [athlete.house_id, currentMonthLike.replace('%', '')], (err, rRow) => {
                  let recorde = rRow && rRow.recorde ? rRow.recorde : 999999; // Se não tem histórico, não quebra recorde ainda
                  if (totalMes > recorde && recorde > 0) {
                    db.get("SELECT id FROM house_points_log WHERE house_id = ? AND description LIKE '%Pomo: Recorde Quebrado%' AND created_at LIKE ?", [athlete.house_id, currentMonthLike], (err, pRecordRow) => {
                      if (!pRecordRow) {
                        db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, NULL, 5, 'Pomo: Recorde Quebrado (+5 automáticos)')", [athlete.house_id]);
                      }
                    });
                  }

                  db.run("COMMIT", (err) => {
                    res.json({ success: true, id: scoreId });
                  });
                }); // End Recorde Histórico db.get
              }); // End Total Mensal db.get
            }); // End athleteCount db.get
          }); // End db.run INSERT scores
              }); // End db.get influencerEffect
        }); // End db.get coringaActive
      }); // End db.serialize
    }); // End db.get athlete
  }); // End db.get rule
} // End function insertScore

// --- API DE CARTAS (ALUNO) ---
app.get('/api/student/:id/cards', (req, res) => {
  const studentId = req.params.id;
  const query = `
        SELECT sc.id, sc.hash, sc.used, sc.acquired_at, 
               c.name, c.description, c.image_path 
        FROM student_cards sc
        JOIN cards c ON sc.card_id = c.id
        WHERE sc.student_id = ? AND sc.used = 0
    `;
  db.all(query, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const mappedRows = rows.map(r => {
      // Normalize name for fallback
      let normalized = (r.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      let fileUnderscoresJpeg = normalized.replace(/[^a-z0-9]/g, '_') + '.jpeg';
      let fileSpacesJpeg = normalized + '.jpeg';

      // Always force relative path to /cartas/ instead of absolute DB paths
      let safeImagePath = r.image_path;
      if (safeImagePath && (safeImagePath.includes('C:\\') || safeImagePath.includes('C:/'))) {
        // Extract filename from absolute path
        const filename = safeImagePath.split(/[\\/]/).pop();
        safeImagePath = '/cartas/' + filename;
      } else if (!safeImagePath) {
        // Fallback based on name if empty
        safeImagePath = '/cartas/' + fileUnderscoresJpeg;
      }

      return {
        ...r,
        image_path: safeImagePath
      };
    });

    res.json(mappedRows);
  });
});

// --- API DE CARTAS (CASA/CAPITÃES) ---
app.get('/api/house/:id/cards', (req, res) => {
  const houseId = req.params.id;
  const query = `
        SELECT sc.id, sc.hash, sc.used, sc.acquired_at, 
               c.name, c.image_path, p.name as student_name
        FROM student_cards sc
        JOIN cards c ON sc.card_id = c.id
        JOIN patients p ON sc.student_id = p.id
        LEFT JOIN athletes a ON p.id = a.patient_id
        WHERE a.house_id = ? AND sc.used = 0
    `;
  db.all(query, [houseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const mappedRows = rows.map(r => {
      let safeImagePath = r.image_path;
      if (safeImagePath && (safeImagePath.includes('C:\\') || safeImagePath.includes('C:/'))) {
        // Extract filename from absolute path
        const filename = safeImagePath.split(/[\\/]/).pop();
        safeImagePath = '/cartas/' + filename;
      }
      return {
        ...r,
        image_path: safeImagePath
      };
    });

    res.json(mappedRows);
  });
});

// --- API PARA USAR CARTA (SISTEMA DE PONTUAÇÃO AUTOMÁTICA DIRETA NO MARCHADB) ---
app.post('/api/student-cards/use', (req, res) => {
  handleCardUsage(req, res);
});

// Added alias to fulfill the user request "IMPLEMENTE a rota '/api/cards/use'"
app.post('/api/cards/use', (req, res) => {
  handleCardUsage(req, res);
});

app.post('/api/usar-carta', (req, res) => {
  handleCardUsage(req, res);
});

function handleCardUsage(req, res) {
  const { student_card_id, hash, card_name, description, target_house_id } = req.body;

  if (!student_card_id || !hash) return res.status(400).json({ error: "Card ID e Hash são obrigatórios" });

  db.get(`
    SELECT sc.id as sc_id, sc.student_id, sc.hash, c.name as cname, a.id as athlete_id, a.house_id
    FROM student_cards sc
    JOIN cards c ON sc.card_id = c.id
    LEFT JOIN athletes a ON a.patient_id = sc.student_id
    WHERE sc.id = ? AND sc.used = 0
  `, [student_card_id], (err, row) => {
    // Note: Hash match was removed from the query condition and moved below for robust matching
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Carta não encontrada ou já usada." });

    // a) Validar o Hash da carta
    if (hash && row.hash && row.hash.trim().toLowerCase() !== hash.trim().toLowerCase()) {
      return res.status(400).json({ error: "Hash inválido" });
    }

    const cardName = row.cname;
    const athleteId = row.athlete_id;
    const houseId = row.house_id;

    if (!athleteId) return res.status(400).json({ error: "Aluno não é atleta registrado de uma casa." });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("UPDATE student_cards SET used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?", [student_card_id]);

      // Mapeamento Dinâmico de Cartas do CEO
      if (cardName === "Senhorinha") {
        db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)", [row.student_id, 8]);
        db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
          [houseId, row.student_id, 2, `Senhorinha: ${description || 'Desafio Concluído'}`], (err) => {
          db.run("COMMIT");
          res.json({ success: true, message: `Senhorinha: +2 meinhas pelo desafio.` });
        });
      } else if (cardName === "Marombinha") {
        db.run("INSERT INTO scores (athlete_id, rule_id) VALUES (?, ?)", [row.student_id, 4]);
        db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
          [houseId, row.student_id, 1, `Marombinha: ${description || 'Desafio Fácil Concluído'}`], (err) => {
          db.run("COMMIT");
          res.json({ success: true, message: "Marombinha: +1 meinha pelo desafio fácil." });
        });
      } else if (cardName === "Vida") {
        db.get(
          "SELECT s.id FROM scores s JOIN scoring_rules sr ON s.rule_id = sr.id WHERE s.athlete_id = ? AND sr.value < 0 ORDER BY s.id DESC LIMIT 1",
          [row.student_id],
          (err, lastFalta) => {
            if (lastFalta) {
              db.run("DELETE FROM scores WHERE id = ?", [lastFalta.id]);
            }
            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
              [houseId, row.student_id, 0, 'Vida: Última falta anulada.'], (err) => {
              db.run("COMMIT");
              res.json({ success: true, message: "Carta Vida usada. Última falta removida." });
            });
          }
        );

      } else if (cardName === "Zica") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Casa alvo não informada para a Zica." });
        }
        db.get("SELECT id, name FROM houses WHERE id = ?", [target_house_id], (err, targetHouse) => {
          if (err || !targetHouse) {
            db.run("ROLLBACK");
            return res.status(400).json({ error: "Casa alvo não encontrada." });
          }

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          const expiresAtIso = expiresAt.toISOString();

          db.run(
            "INSERT INTO active_effects (house_id, effect_type, multiplier, expires_at) VALUES (?, 'ZICA', 2.0, ?)",
            [target_house_id, expiresAtIso],
            (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                [target_house_id, row.student_id, 0, `Zica: Faltas desta casa valerão o dobro por 7 dias!`], (err) => {
                db.run("COMMIT");
                res.json({ success: true, message: `Zica lançada! As faltas da casa ${targetHouse.name} valerão o dobro pelos próximos 7 dias.` });
              });
            }
          );
        });

      } else if (cardName === "Ladino" || cardName === "Trapaça") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: `Casa alvo para a carta ${cardName} não fornecida.` });
        }
        db.get("SELECT id, name FROM houses WHERE id = ?", [target_house_id], (err, targetHouse) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }
          if (!targetHouse) {
            db.run("ROLLBACK");
            return res.status(400).json({ error: `Casa alvo não encontrada.` });
          }

          if (cardName === "Trapaça") {
            // Trapaça é instântanea? Pelo task.md, só 'Zica' e 'Ladino' precisam do status PENDENTE de 24h. A Trapaça diz: "Incremento matemático de 15% na meta_mensal"
            // Logo vamos aplicar direto, ou se precisa ser defendida, entra no queue.
            // Pela task: "Criar status 'PENDENTE' de 24h para as cartas 'Zica' e 'Ladino' antes de aplicar o efeito."
            // Trapaça não está na lista de PENDENTE.
            db.get("SELECT meta_mensal FROM houses WHERE id = ?", [targetHouse.id], (err, tr) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              let currentMeta = tr ? tr.meta_mensal : 0;
              let newMeta = Math.floor(currentMeta * 1.15); // +15%
              db.run("UPDATE houses SET meta_mensal = ? WHERE id = ?", [newMeta, targetHouse.id]);
              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [targetHouse.id, null, 0, `Trapaça: Meta mensal aumentada em 15% (De ${currentMeta} para ${newMeta})`], (err) => {
                db.run("COMMIT");
                res.json({ success: true, message: `Trapaça ativada! Meta da casa ${targetHouse.name} aumentada em 15%.` });
              });
            });
          } else {
            // Ladino vai para PENDENTE (24h de cooldown para Reação)
            const resolveDate = new Date();
            resolveDate.setHours(resolveDate.getHours() + 24);

            db.run("INSERT INTO card_queue (attacker_id, target_house_id, card_name, status, resolve_at) VALUES (?, ?, ?, 'PENDENTE', ?)",
              [row.student_id, targetHouse.id, cardName, resolveDate.toISOString()], (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: err.message });
                }
                db.run("COMMIT");
                res.json({ success: true, message: `Ataque '${cardName}' contra ${targetHouse.name} em curso! Efeito ocorrerá em 24h a menos que a casa alvo reaja.` });
              });
          }
        });
      } else if (cardName === "Influencer") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        db.run("INSERT INTO active_effects (house_id, effect_type, multiplier, expires_at) VALUES (?, 'INFLUENCER', 2.0, ?)", [houseId, expiresAt.toISOString()], (err) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
          db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [houseId, row.student_id, 0, `Influencer: Multiplicador 2x ativado por 7 dias!`], (err) => {
            db.run("COMMIT");
            res.json({ success: true, message: `Influencer ativado! Todos os pontos da sua casa valem o dobro pelos próximos 7 dias.` });
          });
        });
      } else if (cardName === "VAR") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Casa alvo não informada para o VAR." });
        }
        db.get("SELECT id, name FROM houses WHERE id = ?", [target_house_id], (err, targetHouse) => {
          if (err || !targetHouse) { db.run("ROLLBACK"); return res.status(400).json({ error: "Casa alvo não encontrada." }); }

          db.run(
            "INSERT INTO card_queue (attacker_id, target_house_id, card_name, status, invoker_house_id) VALUES (?, ?, 'VAR', 'PENDENTE', ?)",
            [row.student_id, target_house_id, houseId],
            (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                [houseId, row.student_id, 0, `VAR: Prova de Pomo convocada contra a casa ${targetHouse.name}. Aguardando resultado.`], (err) => {
                db.run("COMMIT");
                res.json({ success: true, message: `VAR ativado! A casa ${targetHouse.name} foi convocada a repetir o Pomo. Aguarde o resultado da coordenação.` });
              });
            }
          );
        });
      } else if (cardName === "Coringa") {
        if (!target_house_id) { db.run("ROLLBACK"); return res.status(400).json({ error: "Casa alvo não informada." }); }
        db.get("SELECT id FROM athletes WHERE house_id = ? AND is_captain = 1 LIMIT 1", [target_house_id], (err, targetCaptain) => {
          if (err || !targetCaptain) { db.run("ROLLBACK"); return res.status(400).json({ error: "A casa alvo não possui capitão definido." }); }

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          db.run("INSERT INTO active_effects (house_id, effect_type, multiplier, expires_at, source_captain_id, beneficiary_id) VALUES (?, 'CORINGA_REDIRECTION', 1.0, ?, ?, ?)",
            [houseId, expiresAt.toISOString(), targetCaptain.id, row.student_id], (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [houseId, row.student_id, 0, `Coringa: Todos os pontos ganhos pelo Capitão da casa adversária serão desviados para você por 7 dias!`], (err) => {
                db.run("COMMIT");
                res.json({ success: true, message: "Coringa Ativado! Os pontos do capitão adversário serão desviados para sua casa por 7 dias." });
              });
            });
        });
      } else if (cardName === "Golpe de Estado") {
        // Calcula início da semana (segunda-feira)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=dom, 1=seg...
        const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        const mondayIso = monday.toISOString();

        // Busca ranking semanal
        db.all(
          "SELECT house_id, COALESCE(SUM(points_awarded), 0) as total FROM house_points_log WHERE created_at >= ? GROUP BY house_id ORDER BY total DESC",
          [mondayIso],
          (err, ranking) => {
            if (err || !ranking || ranking.length < 2) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "O ranking semanal ainda não possui dados suficientes." });
            }
            
            let house1st = ranking[0];

            // Validar: quem usa deve ser a casa em ÚLTIMO lugar no ranking semanal
            const lastPlace = ranking[ranking.length - 1];
            if (lastPlace.house_id !== houseId) {
              db.run("ROLLBACK");
              return res.status(400).json({ error: "Apenas a casa em último lugar no ranking semanal pode usar o Golpe de Estado." });
            }

            let execHouse = { house_id: houseId, total: ranking.find(h => h.house_id === houseId)?.total || 0 };

            if (house1st.house_id === execHouse.house_id) {
              db.run("ROLLBACK");
              return res.status(400).json({ error: "Sua casa já está em primeiro lugar!" });
            }

            let stolenPoints = house1st.total;

            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [house1st.house_id, null, -stolenPoints, `Golpe de Estado: Roubados pontos da semana por ${row.student_id}`]);
            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [execHouse.house_id, row.student_id, stolenPoints, `Golpe de Estado: Transferência dos pontos semanais da 1º casa`], (err) => {
              db.run("COMMIT");
              res.json({ success: true, message: `Golpe de Estado Semanal! Sua casa roubou ${stolenPoints} pontos da 1º colocada (Ranking desde segunda-feira).` });
            });
          }
        );
      } else if (cardName === "Aliança") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Capitão aliado não informado." });
        }
        db.get(
          "SELECT a.id, p.name FROM athletes a JOIN patients p ON a.patient_id = p.id WHERE a.house_id = ? AND a.is_captain = 1 LIMIT 1",
          [target_house_id],
          (err, alliedCaptain) => {
            if (err || !alliedCaptain) { db.run("ROLLBACK"); return res.status(400).json({ error: "Capitão da casa alvo não encontrado." }); }

            db.run(
              "INSERT INTO card_queue (attacker_id, target_house_id, card_name, status, allied_captain_id, invoker_house_id) VALUES (?, ?, 'Aliança', 'PENDENTE', ?, ?)",
              [row.student_id, target_house_id, alliedCaptain.id, houseId],
              (err) => {
                if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                  [houseId, row.student_id, 0, `Aliança: Capitão ${alliedCaptain.name} convocado para disputar o Pomo. Aguardando resultado.`], (err) => {
                  db.run("COMMIT");
                  res.json({ success: true, message: `Aliança formada! O capitão ${alliedCaptain.name} disputará o Pomo por você. Aguarde o resultado da coordenação.` });
                });
              }
            );
          }
        );
      } else if (cardName === "Tandera") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Casa alvo não informada para a Tandera." });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const expiresAtIso = expiresAt.toISOString();

        // Registra efeito ativo por 24h
        db.run(
          "INSERT INTO active_effects (house_id, effect_type, expires_at, source_captain_id) VALUES (?, 'TANDERA_ACTIVE', ?, ?)",
          [houseId, expiresAtIso, athleteId],
          (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

            // Busca inventário da casa alvo
            db.all(`
              SELECT c.name, c.rarity, c.description
              FROM student_cards sc
              JOIN cards c ON sc.card_id = c.id
              JOIN athletes a ON a.patient_id = sc.student_id
              WHERE a.house_id = ? AND sc.used = 0
              ORDER BY c.rarity, c.name
            `, [target_house_id], (err, cards) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                [houseId, row.student_id, 0, `Tandera: Olhos de Tandera ativados por 24h contra a casa adversária.`], (err) => {
                db.run("COMMIT");
                res.json({ 
                  success: true, 
                  message: "Olhos de Tandera ativados! Você tem 24h de visão sobre a casa adversária.",
                  cards: cards,
                  expires_at: expiresAtIso
                });
              });
            });
          }
        );
      } else if (cardName === "Invisibilidade") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const expiresAtIso = expiresAt.toISOString();

        db.run(
          "INSERT INTO active_effects (house_id, effect_type, expires_at) VALUES (?, 'INVISIBILIDADE', ?)",
          [houseId, expiresAtIso],
          (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
              [houseId, row.student_id, 0, `Invisibilidade: Escudo ativo por 7 dias contra qualquer ataque.`], (err) => {
              db.run("COMMIT");
              res.json({ success: true, message: "Invisibilidade ativada! Sua casa está protegida contra ataques por 7 dias." });
            });
          }
        );
      } else if (cardName === "Reverso") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const expiresAtIso = expiresAt.toISOString();

        db.run(
          "INSERT INTO active_effects (house_id, effect_type, expires_at) VALUES (?, 'REVERSO', ?)",
          [houseId, expiresAtIso],
          (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
              [houseId, row.student_id, 0, `Reverso: Escudo ativo por 7 dias. Ataques recebidos serão revertidos.`], (err) => {
              db.run("COMMIT");
              res.json({ success: true, message: "Reverso ativado! Qualquer ataque contra sua casa será revertido para o atacante por 7 dias." });
            });
          }
        );
      } else if (cardName === "Spoiler") {
        if (!target_house_id) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Casa alvo não informada para o Spoiler." });
        }

        const currentMonthLike = new Date().toISOString().substring(0, 7) + '%';

        db.get(`
          SELECT 
            h.name as house_name,
            COALESCE(SUM(hpl.points_awarded), 0) as total_mes
          FROM houses h
          LEFT JOIN house_points_log hpl ON hpl.house_id = h.id 
            AND hpl.created_at LIKE ?
          WHERE h.id = ?
          GROUP BY h.id
        `, [currentMonthLike, target_house_id], (err, result) => {
          if (err || !result) { db.run("ROLLBACK"); return res.status(500).json({ error: "Erro ao consultar pontuação." }); }

          db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
            [houseId, row.student_id, 0, `Spoiler: Revelou a parcial da casa ${result.house_name} (${result.total_mes} meinhas no mês).`], (err) => {
            db.run("COMMIT");
            res.json({ 
              success: true, 
              message: `Spoiler: A casa ${result.house_name} possui ${result.total_mes} meinhas acumuladas este mês!` 
            });
          });
        });
      } else {
        // Cartas Genéricas sem Ação Imediata de Soma
        db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [houseId, row.student_id, 0, `Poder Usado: ${cardName}`], (err) => {
          db.run("COMMIT");
          res.json({ success: true, message: `Poder '${cardName}' ativado e registrado no Log!` });
        });
      }
    });
  });
}

// --- API PARA DISTRIBUIR CARTA (ADMIN/SISTEMA) ---
// Ex: Ao completar uma tarefa ou aleatoriamente
app.post('/api/student/:id/cards', (req, res) => {
  const studentId = req.params.id;
  const { card_id } = req.body; // Se não passar, aleatório?

  // Gera Hash Único (Timestamp + Random)
  const crypto = require('crypto');
  const hash = crypto.randomBytes(8).toString('hex').toUpperCase();

  // Se card_id não fornecido, pega um aleatório
  if (!card_id) {
    db.get("SELECT id FROM cards ORDER BY RANDOM() LIMIT 1", [], (err, card) => {
      if (err || !card) return res.status(500).json({ error: "Erro ao selecionar carta" });
      insertCard(studentId, card.id, hash, res);
    });
  } else {
    insertCard(studentId, card_id, hash, res);
  }
});

function insertCard(studentId, cardId, hash, res) {
  db.run(`INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)`,
    [studentId, cardId, hash],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, hash: hash });
    }
  );
}

// --- API DE REAÇÃO (DEFESA) ---
app.post('/api/cards/react', (req, res) => {
  const { student_id, action, card_queue_id, defense_card_hash } = req.body;
  // action = 'REVERSO', 'INVISIBILIDADE' ou 'ACEITAR'

  if (!student_id || !action || !card_queue_id) {
    return res.status(400).json({ error: "Parâmetros insuficientes para reagir." });
  }

  // Se usar carta de defesa, valida a carta do inventário
  if (action !== 'ACEITAR' && !defense_card_hash) {
    return res.status(400).json({ error: "Hash da carta de defesa é obrigatório para Reverso ou Invisibilidade." });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Valida Ataque pendente
    db.get("SELECT * FROM card_queue WHERE id = ? AND status = 'PENDENTE'", [card_queue_id], (err, pendingAttack) => {
      if (err || !pendingAttack) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Ataque não encontrado ou já processado." });
      }

      if (action === 'ACEITAR') {
        // O alvo aceitou o golpe antecipadamente ou o tempo expirou
        // O ideal era processar via cron, mas via requisição:
        // Se for Ladino: -3 pontos da casa alvo e +3 pro atacante
        if (pendingAttack.card_name === "Ladino") {
          db.run("UPDATE card_queue SET status = 'EXECUTADO' WHERE id = ?", [pendingAttack.id]);
          db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [pendingAttack.target_house_id, student_id, -3, `Ataque Ladino originado por ${pendingAttack.attacker_id}`]);
          db.run("COMMIT");
          return res.json({ success: true, message: "Você aceitou o destino do Ladino. Foram debitados -3 pontos." });
        } else if (pendingAttack.card_name === "Zica") {
          db.run("UPDATE card_queue SET status = 'EXECUTADO' WHERE id = ?", [pendingAttack.id]);
          db.run("COMMIT");
          return res.json({ success: true, message: "Você aceitou a Zica." });
        }
      }

      // Valida Carta de Defesa
      db.get("SELECT sc.id as sc_id, c.name as cname FROM student_cards sc JOIN cards c ON sc.card_id = c.id WHERE sc.hash = ? AND sc.student_id = ? AND sc.used = 0", [defense_card_hash, student_id], (err, defCard) => {
        if (err || !defCard) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Carta de defesa inválida." });
        }

        const defName = defCard.cname;
        if ((action === 'REVERSO' && defName !== 'Reverso') || (action === 'INVISIBILIDADE' && defName !== 'Invisibilidade')) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "A carta selecionada não corresponde à ação de defesa escolhida." });
        }

        // Consome Carta de Defesa
        db.run("UPDATE student_cards SET used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?", [defCard.sc_id]);

        if (action === 'INVISIBILIDADE') {
          db.run("UPDATE card_queue SET status = 'CANCELADO' WHERE id = ?", [pendingAttack.id]);
          db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [pendingAttack.target_house_id, student_id, 0, `Invisibilidade: Ataque cancelado.`]);
          db.run("COMMIT");
          return res.json({ success: true, message: "Invisibilidade ativada! Você está imune e o ataque foi cancelado." });
        }

        if (action === 'REVERSO') {
          db.run("UPDATE card_queue SET status = 'REVERTIDO' WHERE id = ?", [pendingAttack.id]);
          // O efeito vira contra a casa do atacante. Criar um PENDENTE devolvendo?
          // Ou executa direto contra a casa dele.
          db.get("SELECT house_id FROM athletes WHERE patient_id = ?", [pendingAttack.attacker_id], (err, attackerAthlete) => {
            if (err || !attackerAthlete) { db.run("ROLLBACK"); return res.status(500).json({ error: "Erro ao reverter." }); }

            if (pendingAttack.card_name === "Ladino") {
              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [attackerAthlete.house_id, null, -3, `Reverso de Ladino sofreu penalidade!`]);
              db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)", [pendingAttack.target_house_id, student_id, 3, `Reverso de Ladino: Roubou de volta!`]);
            }
            // Para a Zica, seria registrar no status. (simplificado)

            db.run("COMMIT");
            return res.json({ success: true, message: "Feitiço revertido contra o feiticeiro!" });
          });
        }
      });
    });
  });
});


// --- API DE RESOLUÇÃO DE FILA (ADMIN) ---

// ROTA 1 - Listar pendentes:
app.get('/api/card-queue/pending', (req, res) => {
  db.all(`
    SELECT cq.*, 
      p_attacker.name as attacker_name,
      h_target.name as target_house_name,
      h_invoker.name as invoker_house_name,
      p_captain.name as allied_captain_name
    FROM card_queue cq
    LEFT JOIN patients p_attacker ON cq.attacker_id = p_attacker.id
    LEFT JOIN houses h_target ON cq.target_house_id = h_target.id
    LEFT JOIN houses h_invoker ON cq.invoker_house_id = h_invoker.id
    LEFT JOIN athletes a_captain ON cq.allied_captain_id = a_captain.id
    LEFT JOIN patients p_captain ON a_captain.patient_id = p_captain.id
    WHERE cq.status = 'PENDENTE'
    ORDER BY cq.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ROTA 1 - Listar casas adversárias com capitães (para o modal):
app.get('/api/houses-targets', (req, res) => {
  db.all(`
    SELECT h.id, h.name, h.color,
      json_group_array(
        CASE WHEN a.is_captain = 1 
        THEN json_object('id', a.id, 'name', p.name)
        ELSE NULL END
      ) as captains_raw
    FROM houses h
    LEFT JOIN athletes a ON a.house_id = h.id AND a.is_captain = 1
    LEFT JOIN patients p ON a.patient_id = p.id
    GROUP BY h.id
    ORDER BY h.name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      captains: JSON.parse(r.captains_raw).filter(c => c !== null)
    }));
    res.json(result);
  });
});

// ROTA 2 - Revelar cartas de uma casa (efeito da Tandera):
app.get('/api/houses/:id/cards-inventory', (req, res) => {
  const houseId = parseInt(req.params.id);
  db.all(`
    SELECT sc.id, sc.hash, c.name, c.rarity, c.description
    FROM student_cards sc
    JOIN cards c ON sc.card_id = c.id
    JOIN athletes a ON a.patient_id = sc.student_id
    WHERE a.house_id = ? AND sc.used = 0
    ORDER BY c.rarity, c.name
  `, [houseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ROTA 2 - Resolver pendente:
app.post('/api/card-queue/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { result } = req.body; // 'VENCEU' ou 'FRACASSOU'

  if (!result) return res.status(400).json({ error: "Resultado obrigatório." });

  db.get("SELECT * FROM card_queue WHERE id = ? AND status = 'PENDENTE'", [id], (err, cq) => {
    if (err || !cq) return res.status(404).json({ error: "Prova pendente não encontrada." });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const nowIso = new Date().toISOString();

      // Verificar Invisibilidade na casa alvo
      db.get(
        "SELECT id FROM active_effects WHERE house_id = ? AND effect_type = 'INVISIBILIDADE' AND expires_at > ? LIMIT 1",
        [cq.target_house_id, nowIso],
        (err, invisEffect) => {
          if (invisEffect) {
            // Cancela o efeito de Invisibilidade usado
            db.run("UPDATE active_effects SET expires_at = ? WHERE id = ?", [nowIso, invisEffect.id]);
            db.run("UPDATE card_queue SET status = 'BLOQUEADO_INVISIBILIDADE' WHERE id = ?", [id]);
            db.run("COMMIT");
            return res.json({ success: true, message: "Ataque bloqueado pela Invisibilidade da casa alvo!" });
          }

          // Verificar Reverso na casa alvo
          db.get(
            "SELECT id FROM active_effects WHERE house_id = ? AND effect_type = 'REVERSO' AND expires_at > ? LIMIT 1",
            [cq.target_house_id, nowIso],
            (err, reversoEffect) => {
              if (reversoEffect) {
                // Cancela o efeito de Reverso usado
                db.run("UPDATE active_effects SET expires_at = ? WHERE id = ?", [nowIso, reversoEffect.id]);
                db.run("UPDATE card_queue SET status = 'REVERTIDO' WHERE id = ?", [id]);
                db.run("COMMIT");
                return res.json({ success: true, message: "Reverso! O ataque foi devolvido para a casa atacante.", reversed: true, new_target: cq.invoker_house_id });
              }

              // Sem escudo - continua fluxo normal
              db.run("UPDATE card_queue SET status = ? WHERE id = ?", [result, id]);

              if (cq.card_name === 'VAR' && result === 'FRACASSOU') {
                // Transfere o Pomo para a casa invocadora
                db.run("UPDATE pomo_records SET house_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1", [cq.invoker_house_id]);
                db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                  [cq.invoker_house_id, cq.attacker_id, 0, `VAR: Adversário fracassou na prova. Pomo transferido.`]);

              } else if (cq.card_name === 'Aliança' && result === 'VENCEU') {
                // Pomo vai para a casa invocadora
                db.run("UPDATE pomo_records SET house_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1", [cq.invoker_house_id]);
                db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                  [cq.invoker_house_id, cq.attacker_id, 0, `Aliança: Capitão aliado venceu o Pomo. Transferido para a casa invocadora.`]);
                // Capitão aliado ganha carta Lendária
                db.get("SELECT id FROM cards WHERE rarity = 'Lendária' ORDER BY RANDOM() LIMIT 1", [], (err, lCard) => {
                  if (lCard) {
                    const crypto = require('crypto');
                    const newHash = crypto.randomBytes(8).toString('hex').toUpperCase();
                    db.get("SELECT patient_id FROM athletes WHERE id = ?", [cq.allied_captain_id], (err, ath) => {
                      if (ath) {
                        db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [ath.patient_id, lCard.id, newHash]);
                      }
                    });
                  }
                });
              }

              db.run("COMMIT", (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: `Prova resolvida: ${result}` });
              });
            }
          );
        }
      );
    });
  });
});


// Rota Agenda (Alias para Appointments - Garantia de compatibilidade)
app.get('/api/agenda', (req, res) => {
  // Redireciona para a lógica de appointments
  const { date, start_date, end_date } = req.query;
  let query = `SELECT a.*, p.name as patient_name
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

  query += " ORDER BY a.appointment_date ASC, a.start_time ASC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Login Route (Ensure it exists and works)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ error: "Preencha todos os campos" });

  db.get("SELECT * FROM patients WHERE username = ?", [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Credenciais inválidas" });

    let isValid = false;
    if (row.password && row.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, row.password);
    } else {
      isValid = (password === row.password);
    }

    if (!isValid) return res.status(401).json({ error: "Credenciais inválidas" });
    res.json(row);
  });
});

// Change Password Route
app.post('/api/change-password', async (req, res) => {
  const { id, currentPassword, newPassword } = req.body;
  if (!id || !currentPassword || !newPassword) return res.status(400).json({ error: "Dados incompletos" });

  db.get("SELECT * FROM patients WHERE id = ?", [id], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Usuário não encontrado" });

    let isValid = false;
    if (row.password && row.password.startsWith('$2')) {
      isValid = await bcrypt.compare(currentPassword, row.password);
    } else {
      isValid = (currentPassword === row.password);
    }

    if (!isValid) return res.status(401).json({ error: "Senha atual incorreta" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE patients SET password = ?, password_changed = 1 WHERE id = ?", [hashedPassword, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Senha alterada com sucesso!" });
    });
  });
});

// --- PORTAL DO ALUNO E CARTAS ---
app.get('/api/student-portal/:id', (req, res) => {
  const patientId = req.params.id;
  db.get("SELECT * FROM patients WHERE id = ?", [patientId], (err, patient) => {
    if (err || !patient) return res.status(404).json({ error: "Aluno não encontrado" });

    db.get("SELECT * FROM athletes WHERE name = ? OR id = ?", [patient.name, patient.id], (err, athlete) => {
      let houseId = patient.house_id || (athlete ? athlete.house_id : 1);

      db.get("SELECT * FROM houses WHERE id = ?", [houseId], (err, house) => {
        let athleteId = athlete ? athlete.id : patientId;

        // Use house_points_log para trazer as descrições customizadas de cartas + regra base
        const historyQuery = `
           SELECT COALESCE(hpl.description, sr.name) as rule_name,
                  COALESCE(hpl.points_awarded, sr.value) as value
           FROM scores sc
           LEFT JOIN scoring_rules sr ON sc.rule_id = sr.id
           LEFT JOIN house_points_log hpl ON hpl.student_id = ? AND hpl.created_at >= sc.created_at AND hpl.created_at <= datetime(sc.created_at, '+1 second')
           WHERE sc.athlete_id = ?
           ORDER BY sc.created_at DESC LIMIT 50
        `;

        db.all(historyQuery, [patientId, patientId], (err, scores) => {
          let totalScore = scores ? scores.reduce((acc, curr) => acc + curr.value, 0) : 0;

          res.json({
            patient: patient,
            house: house || { name: 'Sem Casa', color: '#000033' },
            athlete: { totalScore: totalScore },
            scores: scores || []
          });
        });
      });
    });
  });
});

// --- API DE VERIFICAÇÃO DE POMO E ATAQUE ---
app.get('/api/student/:id/pomo-status', (req, res) => {
  const patientId = req.params.id;

  db.get("SELECT house_id FROM athletes WHERE patient_id = ?", [patientId], (err, athlete) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!athlete) return res.json({ hasPomo: false, hasPendingAttack: false });

    // 1. Verifica de quem é o Pomo
    db.get("SELECT last_pomo_holder FROM pomo_records LIMIT 1", [], (err, pomo) => {
      const isHolder = (pomo && pomo.last_pomo_holder == patientId);

      // 2. Verifica se a Casa do Aluno está sob ataque PENDENTE
      db.all("SELECT * FROM card_queue WHERE target_house_id = ? AND status = 'PENDENTE'", [athlete.house_id], (err, attacks) => {

        const hasPendingAttack = (attacks && attacks.length > 0);
        res.json({
          isHolder: isHolder,
          hasPendingAttack: hasPendingAttack,
          attacks: attacks || []
        });
      });
    });
  });
});

// --- DISTRIBUIÇÃO MANUAL DE CARTAS (Apenas Coordenação/Professores) ---
app.post('/api/cards/grant', (req, res) => {
  const { patient_id, card_name } = req.body; // patient_id from frontend is actually athlete_id
  if (!patient_id || !card_name) {
    return res.status(400).json({ error: "Atleta e carta são obrigatórios." });
  }

  db.get("SELECT patient_id FROM athletes WHERE id = ?", [patient_id], (err, ath) => {
    if (err || !ath) return res.status(404).json({ error: "Atleta não encontrado no banco." });

    const truePatientId = ath.patient_id;

    db.get("SELECT id FROM cards WHERE name = ?", [card_name], (err, card) => {
      if (err || !card) return res.status(404).json({ error: "Carta não encontrada." });

      const crypto = require('crypto');
      const hash = crypto.randomBytes(8).toString('hex').toUpperCase();

      db.run(
        "INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)",
        [truePatientId, card.id, hash],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ 
            success: true, 
            message: `Carta '${card_name}' concedida com sucesso!`,
            hash: hash
          });
        }
      );
    });
  });
});

app.get('/api/cards', (req, res) => {
  const { rarity } = req.query;
  let query = "SELECT id, name, description, rarity, image_path FROM cards";
  let params = [];

  if (rarity) {
    query += " WHERE rarity = ?";
    params.push(rarity);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// --- CAMPO DE BATALHA ---
 
 // ROTA 1 - Coordenação lança Campo de Batalha para um aluno
 app.post('/api/campo-batalha/grant', (req, res) => {
   const { patient_id, granted_by } = req.body;
   if (!patient_id) return res.status(400).json({ error: "Aluno obrigatório." });
 
   db.get("SELECT a.house_id FROM athletes a WHERE a.patient_id = ?", [patient_id], (err, ath) => {
     if (err || !ath) return res.status(404).json({ error: "Atleta não encontrado." });
 
     const expiresAt = new Date();
     expiresAt.setHours(expiresAt.getHours() + 24);
 
     db.run(
       "INSERT INTO campo_batalha_pendentes (patient_id, house_id, granted_by, expires_at) VALUES (?, ?, ?, ?)",
       [patient_id, ath.house_id, granted_by || null, expiresAt.toISOString()],
       function(err) {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ success: true, id: this.lastID, message: "Campo de Batalha concedido! Aluno tem 24h para escolher." });
       }
     );
   });
 });
 
 // ROTA 2 - Aluno verifica se tem Campo de Batalha pendente
 app.get('/api/campo-batalha/pending/:patient_id', (req, res) => {
   const { patient_id } = req.params;
   const nowIso = new Date().toISOString();
 
   db.all(
     "SELECT * FROM campo_batalha_pendentes WHERE patient_id = ? AND status = 'PENDENTE' AND expires_at > ? ORDER BY created_at DESC",
     [patient_id, nowIso],
     (err, rows) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json(rows);
     }
   );
 });
 
 // ROTA 3 - Aluno faz a escolha:
 app.post('/api/campo-batalha/:id/choose', (req, res) => {
   const { id } = req.params;
   const { patient_id, choice } = req.body; // choice: 'meinhas' ou 'carta'
 
   if (!choice || !['meinhas', 'carta'].includes(choice)) {
     return res.status(400).json({ error: "Escolha inválida. Use 'meinhas' ou 'carta'." });
   }
 
   const nowIso = new Date().toISOString();
 
   db.get(
     "SELECT * FROM campo_batalha_pendentes WHERE id = ? AND patient_id = ? AND status = 'PENDENTE' AND expires_at > ?",
     [id, patient_id, nowIso],
     (err, cb) => {
       if (err || !cb) return res.status(404).json({ error: "Campo de Batalha não encontrado ou expirado." });
 
       db.serialize(() => {
         db.run("BEGIN TRANSACTION");
         db.run("UPDATE campo_batalha_pendentes SET status = 'RESOLVIDO', choice = ?, chosen_at = ? WHERE id = ?",
           [choice, nowIso, id]);
 
         if (choice === 'meinhas') {
           // +2 meinhas
           db.get("SELECT id FROM athletes WHERE patient_id = ?", [patient_id], (err, ath) => {
             if (err || !ath) { db.run("ROLLBACK"); return res.status(404).json({ error: "Atleta não encontrado." }); }
 
             db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
               [cb.house_id, patient_id, 2, 'Campo de Batalha: Aluno escolheu +2 meinhas.'], (err) => {
                 db.run("COMMIT", (err) => {
                   if (err) return res.status(500).json({ error: err.message });
                   // Chamamos insertScore DEPOIS do commit para evitar conflito com TRANSACTION interna da insertScore
                   insertScore(ath.id, 105, { json: () => {}, status: () => ({ json: () => {} }) });
                   res.json({ success: true, message: "Você ganhou +2 meinhas pelo Campo de Batalha!" });
                 });
               });
           });
 
         } else {
           // 1 carta comum
           db.get("SELECT id FROM cards WHERE rarity = 'Comum' ORDER BY RANDOM() LIMIT 1", [], (err, card) => {
             if (!card) { db.run("ROLLBACK"); return res.status(500).json({ error: "Nenhuma carta comum disponível." }); }
             const crypto = require('crypto');
             const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
             db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)",
               [patient_id, card.id, hash], (err) => {
               if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
               db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                 [cb.house_id, patient_id, 0, 'Campo de Batalha: Aluno escolheu 1 carta comum.']);
               db.run("COMMIT");
               res.json({ success: true, message: "Você ganhou 1 carta comum pelo Campo de Batalha!" });
             });
           });
         }
       });
     }
   );
 });
 
 // --- IMPORTAÇÃO DE EXCEL ---
const xlsx = require('xlsx');
const uploadExcel = multer({ storage: multer.memoryStorage() });

app.post('/api/admin/import-points', uploadExcel.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      let pending = data.length;
      let errors = [];
      let successCount = 0;

      if (pending === 0) {
        db.run("ROLLBACK");
        return res.json({ success: true, message: "Planilha vazia." });
      }

      data.forEach((row, idx) => {
        const nome = (row.Nome || '').trim();
        const casa = (row.Casa || '').trim();
        const pontos = parseInt(row.Pontos) || 0;
        const motivo = (row.Motivo || 'Importação Excel').trim();

        if (!nome || pontos === 0) {
          errors.push(`Linha ${idx + 2}: Nome inválido ou pontos 0.`);
          checkDone();
          return;
        }

        // CEO Order: BUSCA POR NOME EXATO "WHERE p.name = ?"
        db.get("SELECT a.id as athlete_id, a.house_id, a.patient_id FROM athletes a JOIN patients p ON a.patient_id = p.id WHERE p.name = ?", [nome], (err, athlete) => {
          if (err || !athlete) {
            errors.push(`Linha ${idx + 2}: Aluno exato '${nome}' não encontrado.`);
            checkDone();
          } else {
            // Mapeamento Motivo -> rule_id em scoring_rules
            db.get("SELECT id, value FROM scoring_rules WHERE name = ? AND active = 1", [motivo], (err, ruleMatched) => {
              if (err) {
                errors.push(`Linha ${idx + 2}: Erro ao buscar regra: ${err.message}`);
                checkDone();
                return;
              }

              if (ruleMatched) {
                proceedWithInsert(ruleMatched);
              } else {
                // Segundo nível: busca por LIKE case-insensitive
                db.get(
                  "SELECT id, value FROM scoring_rules WHERE name LIKE ? AND active = 1 LIMIT 1",
                  ["%" + motivo + "%"],
                  (err2, ruleLike) => {
                    if (ruleLike) {
                      proceedWithInsert(ruleLike);
                    } else {
                      // Terceiro nível: remove brackets e tenta novamente
                      const cleanedMotivo = motivo.replace(/\[|\]/g, '');
                      db.get(
                        "SELECT id, value FROM scoring_rules WHERE name LIKE ? AND active = 1 LIMIT 1",
                        ["%" + cleanedMotivo + "%"],
                        (err3, ruleDeep) => {
                          proceedWithInsert(ruleDeep || null);
                        }
                      );
                    }
                  }
                );
              }

              function proceedWithInsert(resolvedRule) {
                const rule_id = resolvedRule ? resolvedRule.id : 99;
                // Se achou uma regra oficial, usa o valor da regra (ex: Presença = 1).
                // Caso contrário (Adhoc/Extra), usa o ponto que está na planilha.
                const points_to_award = resolvedRule && resolvedRule.value !== 0 ? resolvedRule.value : pontos;

                if (!resolvedRule) {
                  errors.push(`Linha ${idx + 2}: Motivo "${motivo}" não mapeado. Usando "Adhoc / Extra" (ID 99).`);
                }

                db.run(`INSERT INTO scores (athlete_id, rule_id, points, created_at)
                        VALUES (?, ?, ?, ?)`,
                  [athlete.patient_id, rule_id, points_to_award, new Date().toISOString()],
                  function (insertErr) {
                    if (insertErr) {
                      errors.push(`Erro inserindo score para ${nome}: ${insertErr.message}`);
                      checkDone();
                      return;
                    }
                    const scoreId = this.lastID;

                    db.run(`INSERT INTO house_points_log (house_id, patient_id, score_id, points_awarded, description)
                            VALUES (?, ?, ?, ?, ?)`,
                      [athlete.house_id, athlete.patient_id, scoreId, points_to_award, motivo], (logErr) => {
                        if (logErr) errors.push(`Erro inserindo log para ${nome}: ${logErr.message}`);
                        else successCount++;
                        checkDone();
                      });
                  });
              }
            });
          }
        });
      });

      function checkDone() {
        pending--;
        if (pending === 0) {
          if (successCount > 0) {
            db.run("COMMIT");
            res.json({ success: true, message: `Importação concluída. ${successCount} registros adicionados. Erros: ${errors.length}`, errors });
          } else {
            db.run("ROLLBACK");
            res.status(400).json({ error: "Nenhum ponto importado.", details: errors });
          }
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao ler a planilha: " + err.message });
  }
});


// --- CHAT POR CASA (PROTOCOLO ZERO QUEBRA) ---

app.get('/api/chat/house/:house_id', (req, res) => {
  const houseId = req.params.house_id;
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() - 48);

  db.all(
    `SELECT hm.id, p.name as sender_name, hm.message, hm.created_at as timestamp, hm.patient_id 
     FROM house_messages hm
     JOIN patients p ON hm.patient_id = p.id
     WHERE hm.house_id = ? AND hm.is_deleted = 0 AND hm.created_at >= ? 
     ORDER BY hm.created_at ASC`,
    [houseId, limitDate.toISOString()],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

app.post('/api/chat/house', (req, res) => {
  const { house_id, patient_id, message } = req.body;
  
  console.log('📥 Recebido chat:', { house_id, patient_id, message });

  if (!house_id || !patient_id || !message) {
    console.log('❌ Validação falhou:', { house_id, patient_id, message });
    return res.status(400).json({ error: "Dados incompletos para envio." });
  }

  // ✅ VALIDAÇÃO: Admin or member access (Fallback athlete_id -> patient_id)
  const queryUser = `
    SELECT p.id as p_id, p.role, a.house_id as a_house_id
    FROM patients p
    LEFT JOIN athletes a ON a.patient_id = p.id
    WHERE p.id = ?
  `;

  db.get(queryUser, [patient_id], (err, row) => {
    if (err) return res.status(500).json({ error: "Erro na validação: " + err.message });
    
    let resolvedPatientId = patient_id;
    let resolvedRole = row ? row.role : null;
    let userFound = !!row;

    if (!userFound) {
      // Tenta fallback: o ID enviado é um athlete_id?
      db.get("SELECT a.patient_id, p.role FROM athletes a JOIN patients p ON a.patient_id = p.id WHERE a.id = ?", [patient_id], (err, ath) => {
        if (ath) {
          console.log(`🔄 Fallback: Traduzindo athlete_id ${patient_id} para patient_id ${ath.patient_id}`);
          checkPermissions(ath.patient_id, ath.role);
        } else {
          return res.status(401).json({ error: "Usuário não identificado (ID: " + patient_id + ")" });
        }
      });
    } else {
      checkPermissions(resolvedPatientId, resolvedRole);
    }

    function checkPermissions(pId, role) {
      if (role === 'admin') {
        return proceedWithChat(pId);
      }
      
      db.get("SELECT id FROM athletes WHERE patient_id = ? AND house_id = ?", [pId, house_id], (err, athlete) => {
        if (err) return res.status(500).json({ error: "Erro ao verificar casa: " + err.message });
        if (!athlete) {
          console.log(`❌ Bloqueio: Paciente ${pId} não pertence à casa ${house_id}`);
          return res.status(403).json({ error: "Você não pertence a esta casa." });
        }
        proceedWithChat(pId);
      });
    }
  });

  function proceedWithChat(pId) {
    // Filtro de censura
    const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|(\d{10,11})/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    if (phoneRegex.test(message) || emailRegex.test(message)) {
      return res.status(403).json({ error: "CENSURA ATIVA: Contato proibido no chat." });
    }

    db.run(
      `INSERT INTO house_messages (house_id, patient_id, message) VALUES (?, ?, ?)`,
      [house_id, pId, message.trim()],
      function(err) {
        if (err) return res.status(500).json({ error: "Erro ao salvar: " + err.message });
        console.log('✅ Mensagem salva:', { house_id, patient_id: pId, id: this.lastID });
        res.json({ success: true, id: this.lastID });
      }
    );
  }
});

app.delete('/api/chat/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const { patient_id } = req.body;

  if (!patient_id) return res.status(400).json({ error: "Identidade não informada." });

  // Admin pode deletar qualquer mensagem
  db.get("SELECT role FROM patients WHERE id = ?", [patient_id], (err, user) => {
    if (user && user.role === 'admin') {
      // Admin deleta qualquer mensagem
      db.run("UPDATE house_messages SET is_deleted = 1 WHERE id = ?", [messageId], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar' });
        res.json({ success: true });
      });
    } else {
      // Aluno só deleta mensagem dele
      db.run("UPDATE house_messages SET is_deleted = 1 WHERE id = ? AND patient_id = ?", 
        [messageId, patient_id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar' });
        res.json({ success: true });
      });
    }
  });
});

// --- IMPORTAÇÃO DE EXCEL ---
app.get('/api/admin/export-template', (req, res) => {
  console.log('🔍 ROTA /api/admin/export-template CHAMADA');
  db.all(`
    SELECT p.name as Nome, h.name as Casa
    FROM athletes a
    JOIN patients p ON a.patient_id = p.id
    JOIN houses h ON a.house_id = h.id
    WHERE p.role = 'atleta'
    ORDER BY h.name, p.name
  `, [], (err, athletes) => {
    if (err) {
      console.error('❌ ERRO NO BANCO:', err.message);
      return res.status(500).json({ error: err.message });
    }

    try {
      const xlsx = require('xlsx');
      console.log('✅ xlsx carregado');
      
      const data = [['Nome', 'Casa', 'Pontos', 'Motivo']];
      athletes.forEach(a => {
        data.push([a.Nome, a.Casa, '', '[+1 Ponto] Presença']);
      });
      console.log('✅ Array de dados montado');

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet(data);
      
      ws['!cols'] = [
        { wch: 40 }, // Nome
        { wch: 15 }, // Casa
        { wch: 10 }, // Pontos
        { wch: 35 }  // Motivo
      ];

      xlsx.utils.book_append_sheet(wb, ws, 'Pontuação');
      
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      console.log('✅ Buffer gerado:', buffer.length, 'bytes');
      
      res.setHeader('Content-Disposition', 'attachment; filename="modelo_pontuacao_marcha_cup.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      console.log('✅ Arquivo enviado com sucesso!');
      
    } catch (err) {
      console.error('❌ ERRO EXCEÇÃO:', err.message);
      console.error('Stack:', err.stack);
      res.status(500).json({ error: err.message });
    }
  });
});

// ==========================================
// SISTEMA DE CONSOLIDAÇÃO MARCHA CUP 2026
// ==========================================

function runWeeklyConsolidation() {
  console.log('[SISTEMA] Iniciando Consolidação Semanal (Sábado 23:59)...');
  
  // 1. Ranking Semanal (Segunda 00:00 até Agora)
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0,0,0,0);
  
  const queryRank = `
    SELECT a.house_id, SUM(sc.points) as total
    FROM scores sc
    JOIN athletes a ON sc.athlete_id = a.patient_id
    WHERE sc.created_at >= ?
    GROUP BY a.house_id
    ORDER BY total DESC
  `;

  db.all(queryRank, [monday.toISOString()], (err, ranking) => {
    if (err || !ranking || ranking.length === 0) return;

    const topHouse = ranking[0].house_id;
    const lastHouse = ranking[ranking.length - 1].house_id;

    // --- PRÊMIO RARA (Top House) ---
    const raraCards = [21, 22, 24, 30];
    const randRara = raraCards[Math.floor(Math.random() * raraCards.length)];
    
    // Entrega para os capitães da Top House
    db.all("SELECT patient_id FROM athletes WHERE house_id = ? AND is_captain = 1", [topHouse], (err, captains) => {
      if (captains) {
        captains.forEach(cap => {
          const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
          db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [cap.patient_id, randRara, hash]);
        });
      }
    });

    // --- PRÊMIO LENDÁRIA (Golpe de Estado - Last House) ---
    db.all("SELECT patient_id FROM athletes WHERE house_id = ? AND is_captain = 1", [lastHouse], (err, captains) => {
      if (captains) {
        captains.forEach(cap => {
          const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
          db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [cap.patient_id, 28, hash]);
        });
      }
    });

    // --- PRÊMIO ÉPICA (Top Individual ou 100% Presença) ---
    // Vamos premiar o Top Scorer Individual da semana
    db.get(`SELECT athlete_id, SUM(points) as pts FROM scores WHERE created_at >= ? GROUP BY athlete_id ORDER BY pts DESC LIMIT 1`, [monday.toISOString()], (err, topScorer) => {
      if (topScorer) {
        const epicaCards = [16, 18, 19];
        const randEpica = epicaCards[Math.floor(Math.random() * epicaCards.length)];
        const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
        db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [topScorer.athlete_id, randEpica, hash]);
      }
    });

    console.log(`[SEMANAL] Consolidação Finalizada. Top: ${topHouse}, Last: ${lastHouse}`);
  });
}

function runMonthlyBonus() {
  console.log('[SISTEMA] Iniciando Fechamento Mensal (Dia 1º 00:00)...');
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = lastMonth.getMonth() + 1;
  const year = lastMonth.getFullYear();

  // 1. Verificar Metas das Casas e Pontuar no Placar (0-9)
  db.all("SELECT id, name FROM houses", [], (err, houses) => {
    houses.forEach(house => {
      // Conta atletas ativos
      db.get("SELECT COUNT(*) as count FROM athletes WHERE house_id = ? AND active = 1", [house.id], (err, athletes) => {
        const goal = (athletes.count * 20) + 10;
        
        // Soma pontos do mês passado
        const monthStart = lastMonth.toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        db.get(`SELECT SUM(sc.points) as total FROM scores sc JOIN athletes a ON sc.athlete_id = a.patient_id 
                WHERE a.house_id = ? AND sc.created_at >= ? AND sc.created_at < ?`, 
                [house.id, monthStart, monthEnd], (err, result) => {
          
          const reached = (result.total || 0) >= goal;
          if (reached) {
            db.run("INSERT INTO competition_scoreboard (house_id, points, month, year, goal_reached) VALUES (?, ?, ?, ?, ?)",
                   [house.id, 1, month, year, 1]);
          }
        });
      });
      
      // 2. Bônus de Capitão (+5 pts)
      db.all("SELECT patient_id FROM athletes WHERE house_id = ? AND is_captain = 1", [house.id], (err, captains) => {
        captains.forEach(cap => {
          db.run("INSERT INTO scores (athlete_id, rule_id, points, description) VALUES (?, ?, ?, ?)", 
                 [cap.patient_id, 0, 5, 'Bônus Mensal de Capitão']);
          db.run("INSERT INTO house_points_log (house_id, student_id, points_awarded, description) VALUES (?, ?, ?, ?)",
                 [house.id, cap.patient_id, 5, 'Bônus Capitão']);
        });
      });
    });
  });

  // 3. Pomo Posse (Lendária para quem detém o recorde final)
  db.all("SELECT athlete_id FROM pomo_records", [], (err, records) => {
    const lendariaCards = [17, 27, 28, 29];
    records.forEach(rec => {
      if (rec.athlete_id) {
        const card = lendariaCards[Math.floor(Math.random() * lendariaCards.length)];
        const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
        db.run("INSERT INTO student_cards (student_id, card_id, hash) VALUES (?, ?, ?)", [rec.athlete_id, card, hash]);
      }
    });
  });
  
  // 4. Zerar Meinhas (Arquivar no monthly_history antes?)
  // O usuário pediu para zerar todo dia 1º.
  db.run("DELETE FROM scores"); // Reset radical das meinhas individuais
  db.run("DELETE FROM house_points_log"); // Reset do log de pontos para o novo ciclo semanal/mensal

  console.log('[MENSAL] Fechamento concluído com sucesso.');
}

// CRONS
// Sábado 23:59
cron.schedule('59 23 * * 6', runWeeklyConsolidation);

// Dia 1º 00:00
cron.schedule('0 0 1 * *', runMonthlyBonus);

// --- SISTEMA DE PRESENÇA AUTOMÁTICA ---
function dailyAttendanceJob() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Só roda seg-sex (1-5)
  if (dayOfWeek < 1 || dayOfWeek > 5) return;
  
  const dateStr = today.toISOString().split('T')[0];
  
  // Busca todos os atletas
  db.all(`SELECT a.id, a.patient_id, a.house_id FROM athletes a WHERE a.active = 1`, [], (err, athletes) => {
    if (err) { console.error("Erro ao buscar atletas", err); return; }
    athletes.forEach(athlete => {
      // Verifica se tem presença lançada
      db.get(`SELECT id, status FROM attendance WHERE patient_id = ? AND date = ?`, 
        [athlete.patient_id, dateStr], 
        (err, att) => {
          let points = -2; // Falta padrão
          let description = 'Falta: -2 pontos';
          
          if (!att || att.status === 'ABSENT') {
            // Sem presença ou marked as ABSENT = falta
            // Verifica Zica
            db.get(`SELECT id FROM active_effects WHERE house_id = ? AND effect_type = 'ZICA' AND expires_at > ?`, 
              [athlete.house_id, new Date().toISOString()], 
              (err, zica) => {
                if (zica) {
                  points = -4;
                  description = 'Falta com Zica: -4 pontos';
                }
                // Insere em house_points_log. A coluna é student_id, mas a foreign key representa o patient_id
                db.run(`INSERT INTO house_points_log (house_id, student_id, points_awarded, description) 
                        VALUES (?, ?, ?, ?)`,
                  [athlete.house_id, athlete.patient_id, points, description],
                  (err) => {
                    if (!err) console.log(`✅ ${athlete.patient_id}: ${description}`);
                  });
              });
          } else if (att.status === 'PRESENT') {
            // Presença = +1
            db.run(`INSERT INTO house_points_log (house_id, student_id, points_awarded, description) 
                    VALUES (?, ?, ?, ?)`,
              [athlete.house_id, athlete.patient_id, 1, 'Presença: +1 ponto'],
              (err) => {
                if (!err) console.log(`✅ ${athlete.patient_id}: Presença +1`);
              });
          }
        });
    });
  });
}

app.post('/api/attendance/bulk', (req, res) => {
  // Validar admin
  if (req.body.admin_id !== 9999) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const { attendances } = req.body; // [{patient_id, house_id, status}, ...]
  if (!attendances) return res.status(400).json({ error: "Nenhum dado enviado" });

  const today = new Date().toISOString().split('T')[0];
  
  attendances.forEach(att => {
    db.run(`INSERT OR REPLACE INTO attendance (patient_id, house_id, date, status) 
            VALUES (?, ?, ?, ?)`,
      [att.patient_id, att.house_id, today, att.status],
      (err) => {
        if (!err) console.log(`✅ ${att.patient_id}: ${att.status} (${today})`);
        else console.error(`Erro presenca: ${err.message}`);
      });
  });
  
  res.json({ success: true, count: attendances.length });
});

// Executa as triggers diariamente
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() === 59) {
    console.log('🔔 Executando dailyAttendanceJob...');
    dailyAttendanceJob();
  }
}, 60 * 1000);

// --------- INICIAR SERVIDOR ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gestão Marcha rodando em http://localhost:${PORT} e acessível via IP de Rede`);
  const logMsg = `[${new Date().toISOString()}] SERVIDOR INICIADO/REINICIADO (Porta: ${PORT}). Estável.\n`;
  require('fs').appendFileSync(require('path').join(__dirname, '../uptime.log'), logMsg, { encoding: 'utf8' });
});
