const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar .env manualmente
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let poolConfig = {};

console.log('--- DB CONNECTION INIT ---');

// 1. MODO PRODUÇÃO (CLOUD RUN - PREFERENCIAL)
// Se tivermos o Instance Connection Name, usamos o socket nativo.
if (process.env.INSTANCE_CONNECTION_NAME) {
  console.log("🚀 MODO PROD: Detectado INSTANCE_CONNECTION_NAME");
  console.log(`📡 Socket: /cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`);

  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS ? decodeURIComponent(process.env.DB_PASS) : undefined,
    database: process.env.DB_NAME || 'postgres',
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
    // Sockets Unix não suportam SSL e nem porta TCP.
    // Ignoramos port e ssl propositalmente. A chave 'ssl' NÃO deve existir.
  };
}

// 2. MODO PRODUÇÃO (CLOUD RUN - VARIÁVEIS PG NATIVAS)
// Caso o usuário tenha injetado PGHOST via gcloud (como fizemos no passo anterior)
else if (process.env.PGHOST && process.env.PGHOST.includes('/cloudsql/')) {
  console.log("🚀 MODO PROD: Detectado PGHOST (Socket)");
  poolConfig = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    // SSL removido completamente
  };
}

// 3. MODO LOCAL / DEV (Conn String)
else if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);

    // Verificação Híbrida: Às vezes passamos socket via URL params
    const socketHost = dbUrl.searchParams.get('host');

    if (socketHost && socketHost.startsWith('/')) {
      console.log("☁️  MODO MISTO: Socket via DATABASE_URL");
      poolConfig = {
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.slice(1),
        host: socketHost,
        ssl: false
      };
    } else {
      console.log("💻 MODO LOCAL: TCP/IP via DATABASE_URL");
      poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Cloud SQL via IP Público EXIGE SSL
      };
    }

  } catch (e) {
    console.error("⚠️  Erro Parse URL Local:", e.message);
    // Fallback cego
    poolConfig = { connectionString: process.env.DATABASE_URL };
  }
} else {
  console.error("❌ ERRO CRÍTICO: Nenhuma configuração de DB disponível.");
}

// ULTIMATE OVERRIDE removido para evitar SSL em Sockets
/* 
if (process.env.PGSSLMODE === 'disable') {
   // ...
}
*/

console.log("⚙️  Config Final (Sanitizada):", {
  ...poolConfig,
  password: poolConfig.password ? '***' : undefined,
  connectionString: poolConfig.connectionString ? 'HTTPS://***' : undefined
});

// ... (previous code above remains the same until pool creation)

const pgPool = new Pool(poolConfig);

// GARANTIA DE TIMEZONE: Força o banco a operar no horário de Brasília
pgPool.on('connect', (client) => {
  client.query("SET TIMEZONE TO 'America/Sao_Paulo'").catch(e => console.error("Erro TZ:", e));
});

const DB_LOCK_FILE = path.join(__dirname, 'db_init.lock');

async function initializeDB() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema_pg.sql'), 'utf8');
    await pgPool.query(schema);

    // V9 Migration
    const migration = fs.readFileSync(path.join(__dirname, 'migration_v9.sql'), 'utf8');
    await pgPool.query(migration);

    // V10 Migration
    const migration10 = fs.readFileSync(path.join(__dirname, 'migration_v10.sql'), 'utf8');
    await pgPool.query(migration10);

    console.log("✅ Banco de dados PostgreSQL inicializado e verificado (V10 Migrated).");
  } catch (err) {
    console.error("❌ Erro na inicialização do DB (PG):", err.message);
  }
}

// ========== SQLITE FALLBACK ADAPTER ==========
// If Postgres fails or is not configured efficiently locally, we fallback to SQLite
// This ensures the user can run the project immediately.

const sqlite3 = require('sqlite3').verbose();
let sqliteDb = null;

function getSQLite() {
  if (!sqliteDb) {
    const dbPath = path.join(__dirname, 'marcha.db');
    console.log("⚠️  FALLBACK: Usando SQLite em", dbPath);
    sqliteDb = new sqlite3.Database(dbPath);
  }
  return sqliteDb;
}

// Wrapper to mimic PG Pool
const poolWrapper = {
  query: async (text, params) => {
    // Tenta PG primeiro se estiver configurado
    if (poolConfig.host || poolConfig.connectionString) {
      try {
        return await pgPool.query(text, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          // Fallback to SQLite below
          // console.warn("PG Connection failed, falling back to SQLite for this query.");
        } else {
          throw err; // Outros erros de SQL devem explodir
        }
      }
    }

    // SQLite Logic
    return new Promise((resolve, reject) => {
      const db = getSQLite();
      console.log("sqlite input:", text, params);

      // 1. Convert $N to ? and re-map params
      // Postgres allows reusing parameters (e.g., $1 used twice), but SQLite's ? is strictly positional.
      // We need to rebuild the SQL and the params array.

      const newParams = [];
      let sql = text.replace(/\$(\d+)/g, (match, index) => {
        const paramIndex = parseInt(index, 10) - 1; // $1 is index 0
        if (paramIndex >= 0 && paramIndex < params.length) {
          newParams.push(params[paramIndex]);
          return '?';
        }
        return match; // Should usually not happen if query is valid
      });

      // Strip RETURNING clause for SQLite
      if (text.match(/RETURNING/i)) {
        sql = sql.replace(/RETURNING\s+[\w\*,]+/i, '');
      }

      // Use the new re-mapped parameters
      const finalParams = newParams;

      // 2. Detect Operation
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      const isInsert = text.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = text.trim().toUpperCase().startsWith('UPDATE');

      if (isSelect) {
        db.all(sql, finalParams, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows, rowCount: rows.length });
        });
      } else {
        // Insert/Update/Delete
        db.run(sql, finalParams, function (err) {
          if (err) return reject(err);

          // Emulate RETURNING id if needed
          // Currently logic assumes INSERT ... RETURNING id returns rows[0].id
          if (isInsert && text.toUpperCase().includes('RETURNING ID')) {
            resolve({
              rows: [{ id: this.lastID }],
              rowCount: this.changes
            });
          } else {
            resolve({
              rows: [],
              rowCount: this.changes
            });
          }
        });
      }
    });
  },
  connect: async () => {
    // Mock client for transactions if needed, simplistic
    return {
      query: (t, p) => poolWrapper.query(t, p),
      release: () => { }
    }
  }
};


// Initialization only for PG (if we have creds)
if (poolConfig.host || poolConfig.connectionString) {
  initializeDB();
}

module.exports = {
  query: (text, params) => poolWrapper.query(text, params),
  pool: poolWrapper
};

