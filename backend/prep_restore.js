
const fs = require('fs');
const path = require('path');

const officialIndex = `require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('./db');
const crypto = require('crypto');
const os = require('os');

const app = express();
app.use(express.json());

const port = 3000;

// CORS e Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Arquivos EstÃ¡ticos
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/img/cards', express.static('C:/Marcha/cartas'));

// --- ENGINE DE PONTUAÃ‡ÃƒO (SEÃ‡ÃƒO 3) ---
const generateHash = (data) => crypto.createHash('sha256').update(data + Date.now()).digest('hex').substring(0, 12);

// 1. Casas e Ranking
app.get('/api/houses', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM houses ORDER BY points DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/houses/:id', async (req, res) => {
  try {
    const houseRes = await pool.query("SELECT * FROM houses WHERE id = $1", [req.params.id]);
    if (houseRes.rowCount === 0) return res.status(404).json({ error: "Casa nÃ£o encontrada" });
    const house = houseRes.rows[0];
    const athCount = await pool.query("SELECT COUNT(*) as count FROM patients WHERE house_id = $1 AND role = 'atleta'", [house.id]);
    house.meta_mensal = (athCount.rows[0].count * 20) + 10;
    const athletes = await pool.query("SELECT id, name, meinhas_month, photo FROM patients WHERE house_id = $1 AND active = 1 ORDER BY meinhas_month DESC", [req.params.id]);
    res.json({ house, athletes: athletes.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Login e PermissÃµes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE (username = $1 OR name = $1) AND password = $2 AND active = 1",
      [username, password]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: "Credenciais invÃ¡lidas" });
    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role, // 'atleta', 'capitao', 'coord', 'admin'
      house_id: user.house_id,
      photo: user.photo
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Outras rotas originais (simplificadas para estabilidade)
app.get('/api/rules', async (req, res) => {
  const result = await pool.query("SELECT * FROM scoring_rules WHERE active = 1 ORDER BY value DESC");
  res.json(result.rows);
});

app.get('/', (req, res) => res.redirect('/login.html'));

app.listen(port, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    const ips = [];
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const face of interfaces) {
            if (face.family === 'IPv4' && !face.internal) {
                ips.push(face.address);
            }
        }
    }
    console.log("Backend rodando na porta " + port);
    ips.forEach(ip => {
        console.log("SISTEMA PRONTO! Acesse de outros PCs usando: http://" + ip + ":" + port);
    });
});`;

const officialDb = `const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sqliteDb = null;
const isSQLite = true;
const skipInit = process.env.SKIP_INIT === 'true';

console.log('--- DB CONNECTION INIT (MARCHA CUP OFFICIAL) ---');

const dbPath = path.join(__dirname, '../database.sqlite');
sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("â Œ Erro ao abrir SQLite:", err.message);
    } else {
        console.log("âœ… Conectado ao SQLite: " + dbPath);
        if (!skipInit) {
            const schema = fs.readFileSync(path.join(__dirname, 'schema_official.sql'), 'utf8');
            sqliteDb.exec(schema, (err) => {
                if (err) console.error("âš  Erro ao aplicar schema:", err.message);
                else console.log("âœ… Schema oficial garantido.");
            });
        }
    }
});

const poolWrapper = {
    query: async (text, params) => {
        return new Promise((resolve, reject) => {
            if (!sqliteDb) return reject(new Error("DB not ready"));
            
            let sql = text.replace(/\\$(\\d+)/g, '?');
            const isSelect = text.trim().toUpperCase().startsWith('SELECT');
            
            if (isSelect) {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows, rowCount: rows.length });
                });
            } else {
                sqliteDb.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
                });
            }
        });
    }
};

module.exports = {
    query: (text, params) => poolWrapper.query(text, params),
    pool: poolWrapper
};`;

fs.writeFileSync('index.js', officialIndex, 'utf8');
fs.writeFileSync('db.js', officialDb, 'utf8');
console.log('Restore scripts: OK');
`;

fs.writeFileSync('restore_official.js', officialRestore, 'utf8');
console.log('Main restore file created.');
