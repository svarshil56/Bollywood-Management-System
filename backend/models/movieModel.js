const pool = require("../db");
const fs = require("fs/promises");
const path = require("path");

const SQL_FILE_PATH = path.resolve(__dirname, "../../DATA/user_query.sql");

const removeLeadingComments = (queryText) =>
  queryText.replace(/^(\s*(--.*(?:\r?\n|$)|\/\*[\s\S]*?\*\/))*/, "");

const normalizeSqlInput = (queryText) => {
  let sql = removeLeadingComments(queryText).trim();

  // Allow one optional, controlled search_path statement at the top of the file.
  sql = sql.replace(/^set\s+search_path\s+to\s+movie_db\s*;\s*/i, "");

  // Clean leading comments again (in case comments were placed immediately after the search_path line)
  sql = removeLeadingComments(sql).trim();

  return sql;
};

const isReadOnlyQuery = (queryText) => {
  const normalized = normalizeSqlInput(queryText);

  return /^(select|with)\b/i.test(normalized);
};

const executeReadOnlyQuery = async (queryToRun) => {
  const client = await pool.connect();
  try {
    // 1. Start a strict read-only transaction to block CTE data modification (e.g., WITH x AS (DELETE ...))
    await client.query("BEGIN READ ONLY");
    
    // 2. Force Extended Query Protocol by passing `values: []`. 
    // This physically blocks Query Stacking (e.g., SELECT *; DROP TABLE;) at the driver level.
    const result = await client.query({
      text: queryToRun,
      values: []
    });
    
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message?.includes('connect')) {
      throw new Error(`Database connection failed: ${err.message}. Check your DATABASE_URL in .env.`);
    }
    if (err.message?.includes('read-only transaction')) {
      throw new Error("Security Violation: Data modification statements are blocked.");
    }
    if (err.message?.includes('cannot insert multiple commands')) {
      throw new Error("Security Violation: Multiple statements (query stacking) are blocked.");
    }
    throw err;
  } finally {
    client.release();
  }
};

const getMoviesWithProduction = async () => {
  try {
    const result = await pool.query(`
      SELECT m.title, m.release_date, p.name AS production_house
      FROM movie_db.movie m
      JOIN movie_db.production_house p
      ON m.production_id = p.production_id
    `);
    return result.rows;
  } catch (connErr) {
    throw new Error(
      `Database query failed: ${connErr.message}. Ensure your DATABASE_URL is set correctly and the schema 'movie_db' has been initialized.`
    );
  }
};

const runSqlFromFile = async () => {
  const sqlText = await fs.readFile(SQL_FILE_PATH, "utf8");

  if (!sqlText.trim()) {
    throw new Error(
      "SQL file is empty. Please add a SELECT query in DATA/user_query.sql.",
    );
  }

  if (!isReadOnlyQuery(sqlText)) {
    throw new Error(
      "Only SELECT/WITH queries are allowed in DATA/user_query.sql (optional: SET search_path TO movie_db; at top).",
    );
  }

  const queryToRun = normalizeSqlInput(sqlText);
  const result = await executeReadOnlyQuery(queryToRun);

  return {
    source: "DATA/user_query.sql",
    rowCount: result.rowCount,
    columns: result.fields.map((field) => field.name),
    rows: result.rows,
  };
};

const runSqlFromText = async (sqlText) => {
  if (!sqlText.trim()) {
    throw new Error(
      "SQL text is empty. Write a SELECT/WITH query and try again.",
    );
  }

  if (!isReadOnlyQuery(sqlText)) {
    throw new Error(
      "Only SELECT/WITH queries are allowed (optional: SET search_path TO movie_db; at top).",
    );
  }

  const queryToRun = normalizeSqlInput(sqlText);
  const result = await executeReadOnlyQuery(queryToRun);

  return {
    source: "frontend SQL editor",
    rowCount: result.rowCount,
    columns: result.fields.map((field) => field.name),
    rows: result.rows,
  };
};

const getDatabaseSchemaMetadata = async () => {
  const columnsQuery = `
    SELECT 
      table_name, 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'movie_db'
    ORDER BY table_name, ordinal_position;
  `;

  const pkQuery = `
    SELECT
      kcu.table_name, 
      kcu.column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'movie_db';
  `;

  const fkQuery = `
    SELECT
      kcu.table_name,
      kcu.column_name,
      ccu.table_name  AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
     AND tc.constraint_type = 'FOREIGN KEY'
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name        = tc.constraint_name
     AND rc.constraint_schema      = tc.table_schema
    JOIN information_schema.key_column_usage AS ccu
      ON ccu.constraint_name  = rc.unique_constraint_name
     AND ccu.constraint_schema = rc.unique_constraint_schema
     AND ccu.ordinal_position  = kcu.position_in_unique_constraint
    WHERE tc.table_schema = 'movie_db'
    ORDER BY kcu.table_name, kcu.ordinal_position;
  `;

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    throw new Error(
      `Database connection failed: ${connErr.message}. Check your root .env file database configuration URL.`
    );
  }

  try {
    const columnsResult = await client.query(columnsQuery);
    const pkResult = await client.query(pkQuery);
    const fkResult = await client.query(fkQuery);

    if (columnsResult.rows.length === 0) {
      throw new Error(
        "No tables found in the 'movie_db' schema. Please execute the SQL scripts in the 'DATA' directory (schema.sql, dbms_inserts.sql, indexes.sql) in your Neon SQL Editor to initialize the database."
      );
    }

    const schema = {};

    columnsResult.rows.forEach(col => {
      const tbl = col.table_name;
      if (!schema[tbl]) {
        schema[tbl] = {
          tableName: tbl,
          columns: [],
          primaryKeys: [],
          foreignKeys: []
        };
      }
      schema[tbl].columns.push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultVal: col.column_default
      });
    });

    pkResult.rows.forEach(pk => {
      const tbl = pk.table_name;
      if (schema[tbl]) {
        schema[tbl].primaryKeys.push(pk.column_name);
      }
    });

    fkResult.rows.forEach(fk => {
      const tbl = fk.table_name;
      if (schema[tbl]) {
        schema[tbl].foreignKeys.push({
          column: fk.column_name,
          foreignTable: fk.foreign_table_name,
          foreignColumn: fk.foreign_column_name
        });
      }
    });

    return Object.values(schema);
  } finally {
    client.release();
  }
};

module.exports = { 
  getMoviesWithProduction, 
  runSqlFromFile, 
  runSqlFromText,
  getDatabaseSchemaMetadata 
};

