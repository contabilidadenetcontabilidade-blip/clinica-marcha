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
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'postgres',
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
    // Sockets Unix não suportam SSL e nem porta TCP.
    // Ignoramos port e ssl propositalmente.
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
    ssl: false // Forçar desligado para sockets
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

// ULTIMATE OVERRIDE
if (process.env.PGSSLMODE === 'disable') {
  console.log("🛡️  OVERRIDE: PGSSLMODE=disable. Forçando SSL desligado.");
  poolConfig.ssl = false;
}

console.log("⚙️  Config Final (Sanitizada):", {
  ...poolConfig,
  password: poolConfig.password ? '***' : undefined,
  connectionString: poolConfig.connectionString ? 'HTTPS://***' : undefined
});

const pool = new Pool(poolConfig);

const DB_LOCK_FILE = path.join(__dirname, 'db_init.lock');

async function initializeDB() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema_pg.sql'), 'utf8');
    await pool.query(schema);
    console.log("✅ Banco de dados PostgreSQL inicializado e verificado.");
  } catch (err) {
    console.error("❌ Erro na inicialização do DB:", err);
  }
}

// Inicializa no start
initializeDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
