const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const dbConfig = {
  ssl: (isProduction || process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,

  // Pool tuning — keeps a warm connection alive
  min: 1,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 8000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
} else {
  dbConfig.user     = process.env.DB_USER;
  dbConfig.host     = process.env.DB_HOST;
  dbConfig.database = process.env.DB_NAME;
  dbConfig.password = process.env.DB_PASS;
  dbConfig.port     = process.env.DB_PORT || 5432;
}

const pool = new Pool(dbConfig);

// ── Set search_path once per new physical connection (not per query) ──
// Neon pooled mode doesn't allow startup params, so we do it on the 'connect' event.
pool.on('connect', (client) => {
  client.query("SET search_path TO movie_db").catch(() => {});
});

// ── Warm-up: open a connection immediately so the first user query is instant ──
pool.connect()
  .then(client => {
    console.log("✓ Neon DB connection warmed up (search_path=movie_db)");
    client.release();
  })
  .catch(err => console.warn("⚠ DB warm-up failed (non-fatal):", err.message));

// ── Keep-alive ping every 4 minutes to prevent Neon from suspending ──
setInterval(() => {
  pool.query("SELECT 1").catch(() => {});
}, 4 * 60 * 1000);

module.exports = pool;
