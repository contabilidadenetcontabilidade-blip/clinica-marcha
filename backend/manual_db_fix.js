const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fix() {
    console.log("Starting Manual DB Fix...");

    // Replicate Production Config Logic from db.js
    let poolConfig = {};
    if (process.env.INSTANCE_CONNECTION_NAME) {
        // Cloud Proxy local usage? No, local usually via DATABASE_URL or specific proxy port.
        // If user has proxy running on localhost, we might need 127.0.0.1
        // Let's assume DATABASE_URL is set in .env for local access?
    }

    if (process.env.DATABASE_URL) {
        console.log("Using DATABASE_URL from .env");
        poolConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        console.log("No DATABASE_URL found. Checking other vars...");
        // If user has local proxy to Cloud SQL started, they might use:
        // PGHOST=127.0.0.1 PGPORT=5432 ...
        if (process.env.PGHOST) {
            poolConfig = {
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWORD,
                database: process.env.PGDATABASE,
                port: process.env.PGPORT || 5432
            };
        }
    }

    if (!poolConfig.host && !poolConfig.connectionString) {
        console.error("No valid DB config found in .env for local execution.");
        process.exit(1);
    }

    const pool = new Pool(poolConfig);

    try {
        console.log("Creating scoring_rules...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS scoring_rules (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          value INTEGER NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log("Creating house_points_log...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS house_points_log (
          id SERIAL PRIMARY KEY,
          house_id INTEGER REFERENCES houses(id),
          student_id INTEGER REFERENCES patients(id), 
          rule_id INTEGER REFERENCES scoring_rules(id),
          points_awarded INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("SUCCESS: Tables created.");
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        await pool.end();
    }
}

fix();
