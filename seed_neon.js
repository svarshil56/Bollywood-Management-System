const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL not found in .env file.");
    process.exit(1);
  }

  console.log("🔌 Connecting to online Neon PostgreSQL Database...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Database connection established successfully.");

    console.log("⚡ 1. Initializing schemas & tables from DATA/schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "DATA", "schema.sql"), "utf8");
    await client.query(schemaSql);
    console.log("✅ All tables created successfully.");

    console.log("⚡ 2. Importing data records from DATA/dbms_inserts.sql (this may take 2-4 seconds)...");
    const insertsSql = fs.readFileSync(path.join(__dirname, "DATA", "dbms_inserts.sql"), "utf8");
    await client.query(insertsSql);
    console.log("✅ Seed database records inserted successfully.");

    console.log("⚡ 3. Creating performance optimization indexes from DATA/indexes.sql...");
    const indexesSql = fs.readFileSync(path.join(__dirname, "DATA", "indexes.sql"), "utf8");
    await client.query(indexesSql);
    console.log("✅ B-Tree composite indexes created successfully.");

    client.release();
    console.log("🎉 Seeding complete! Your cloud database is fully initialized.");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
